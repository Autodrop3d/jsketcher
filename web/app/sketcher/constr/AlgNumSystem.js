import {createByConstraintName} from "./solverConstraints";
import {Param, prepare} from "./solver";
import {findConstructionCluster} from "./constructions";
import {GCCircle, GCPoint} from "./constractibles";
import {eqEps, eqTol} from "../../brep/geom/tolerance";
import {Polynomial, POW_1_FN} from "./polynomial";
import {compositeFn, NOOP} from "../../../../modules/gems/func";
import {sq} from "../../math/math";

export class AlgNumSubSystem {


  generator = NOOP;//new BoundaryObjectsGenerator();

  allConstraints = [];

  ownParams = new Set();

  readOnlyParams = new Set();

  generatedParams = new Set();

  paramToIsolation = new Map();

  eliminatedParams = new Map();

  // generators = [];
  subSystems = []; //subsystems are generated by generators only

  polynomials = [];
  substitutedParams = [];
  polyToConstr = new Map();

  conflicting = new Set();
  redundant  = new Set();

  snapshot = new Map();

  dof = 0;

  constructor(generator = NOOP) {
    this.generator = generator;

    this.solveStatus = {
      error: 0,
      success: true
    }

  }


  get fullyConstrained() {
    return this.dof === 0;
  }

  validConstraints(callback) {
    this.allConstraints.forEach(c => {
      if (!this.conflicting.has(c)) {
        callback(c);
      }
    });
  }

  addConstraint(constraint, _ancestorParams) {

    if (this.canBeAdded(constraint.params)) {
      // this.constraints.push(constraint);
      // this.constraints
    }

    this.makeSnapshot();

    this.allConstraints.push(constraint);

    this.prepare();
    if (!this.isConflicting(constraint)) {
      this.solveFine();
      console.log(this.solveStatus);
      if (!this.solveStatus.success) {
        console.log("adding to conflicts");
        this.conflicting.add(constraint);
      }
    }

    if (this.isConflicting(constraint)) {
      this.rollback();
    // } else if (this.fullyConstrained) {
    //   this.rollback();
    //   this.conflicting.add(constraint);
    //   this.redundant.add(constraint);
    } else {
      this.updateDOF();
      this.updateFullyConstrainedObjects();
    }

  }

  isConflicting(constraint) {
    return this.conflicting.has(constraint);
  }

  updateDOF() {

    let vars = 0;
    let equations = 0;

    this.validConstraints(c => {
      equations ++;
      c.params.forEach(p => {
        if (!this.readOnlyParams.has(p)) {
          vars++
        }
      })
    });

    this.dof = vars - equations;
  }

  makeSnapshot() {
    this.snapshot.clear();
    this.validConstraints(c => c.params.forEach(p => this.snapshot.set(p, p.get())));
  }

  rollback() {
    this.snapshot.forEach((val, param) => param.set(val));
  }

  reset() {
    this.polynomials = [];
    this.substitutedParams = [];
    this.eliminatedParams.clear();
    this.polyToConstr.clear();
    this.paramToIsolation.clear();
  }

  evaluatePolynomials() {
    this.validConstraints(c => {
      c.collectPolynomials(this.polynomials);
      this.polynomials.forEach(p => this.polyToConstr.set(p, c))
    });

    console.log('reducing system:');
    this.polynomials.forEach(p => console.log(p.toString()));

    let requirePass = true;

    while (requirePass) {
      requirePass = false;
      for (let i = 0; i < this.polynomials.length; ++i) {
        const polynomial = this.polynomials[i];
        if (!polynomial) {
          continue;
        }

        if (polynomial.monomials.length === 0) {
          this.conflicting.add(this.polyToConstr.get(polynomial));
          console.log("CONFLICT: " + polynomial.toString());
          if (eqEps(polynomial.constant, 0)) {
            this.redundant.add(this.polyToConstr.get(polynomial));
            console.log("REDUNDANT");
          }
          this.polynomials[i] = null;
        } else if (polynomial.isLinear && polynomial.monomials.length === 1) {
          const monomial = polynomial.monomials[0];
          const terms = monomial.terms;
          if (terms.length === 1) {
            const term = terms[0];
            if (term.fn.degree === 1) {
              const p = term.param;
              const val = - polynomial.constant / monomial.constant;
              p.set(val);

              this.eliminatedParams.set(p, val);

              for (let polynomial of this.polynomials) {
                if (polynomial) {
                  polynomial.eliminate(p, val);
                }
              }

              requirePass = true;
            }
          }

          this.polynomials[i] = null;
        } else if (polynomial.monomials.length === 2 && polynomial.isLinear) {
          const [m1, m2] = polynomial.monomials;
          let p1 = m1.linearParam;
          let p2 = m2.linearParam;

          const constant = - m2.constant / m1.constant;
          if (eqEps(polynomial.constant, 0)) {

            for (let polynomial of this.polynomials) {
              if (polynomial) {
                polynomial.substitute(p1, p2, constant);
              }
            }
            this.substitutedParams.push([p1, new Polynomial().monomial(constant).term(p2, POW_1_FN)]);
            this.polynomials[i] = null;
            requirePass = true;
          } else {
            const b = - polynomial.constant / m1.constant;

            let transaction = compositeFn();
            for (let polynomial of this.polynomials) {
              if (polynomial) {
                const polyTransaction = polynomial.linearSubstitution(p1, p2, constant, b);
                if (!polyTransaction) {
                  transaction = null;
                  break;
                }
                transaction.push(polyTransaction);
                transaction.push(() => {
                  this.substitutedParams.push([p1, new Polynomial(b).monomial(constant).term(p2, POW_1_FN)]);
                  this.polynomials[i] = null;
                });
              }
            }
            if (transaction) {
              transaction();
              requirePass = true;
            }
          }
        }
      }

      if (requirePass) {
        this.polynomials.forEach(polynomial => polynomial && polynomial.compact());
      }
    }


    this.polynomials = this.polynomials.filter(p => p);

  }


  prepare() {

    this.reset();

    this.evaluatePolynomials();

    this.polynomialIsolations = this.splitByIsolatedClusters(this.polynomials);
    this.polynomialIsolations.forEach(iso => {
      iso.beingSolvedParams.forEach(solverParam => this.paramToIsolation.set(solverParam.objectParam, iso))
    });

    console.log('solving system:');
    this.polynomialIsolations.forEach((iso, i) => {
      console.log(i + ". ISOLATION, DOF: " + iso.dof);
      iso.polynomials.forEach(p => console.log(p.toString()));
    });

    console.log('with respect to:');
    this.substitutedParams.forEach(([x, expr]) => console.log('X' + x.id  + ' = ' + expr.toString()));
  }

  splitByIsolatedClusters(polynomials) {


    const graph = new Map();

    function link(a, b) {
      let list = graph.get(a);
      if (!list) {
        list = [];
        graph.set(a, list);
      }
      list.push(b);
    }

    const visited = new Set();

    polynomials.forEach(pl => {
      visited.clear();
      pl.visitParams(p => {
        if (visited.has(p)) {
          return;
        }
        visited.add(p);
        link(p, pl);
        link(pl, p);
      })
    });

    visited.clear();

    const clusters = [];

    for (let initPl of polynomials) {
      if (visited.has(initPl)) {
        continue
      }
      const stack = [initPl];
      const isolation = [];
      while (stack.length) {
        const pl = stack.pop();
        if (visited.has(pl)) {
          continue;
        }
        isolation.push(pl);
        visited.add(pl);
        const params = graph.get(pl);
        for (let p of params) {
          let linkedPolynomials = graph.get(p);
          for (let linkedPolynomial of linkedPolynomials) {
            if (linkedPolynomial !== pl) {
              stack.push(linkedPolynomial);
            }
          }
        }
      }
      if (isolation.length) {
        clusters.push(new Isolation(isolation));
      }
    }

    return clusters;
  }

  solveRough() {
    this.solve(true);
  }

  solveFine() {
    this.solve(false);
  }


  solve(rough) {
    this.generator();

    this.polynomialIsolations.forEach(iso => {
      iso.solve(rough);
    });

    if (!rough) {

      this.solveStatus.error = 0;
      this.solveStatus.success = true;

      this.polynomialIsolations.forEach(iso => {
        this.solveStatus.error = Math.max(this.solveStatus.error, iso.solveStatus.error);
        this.solveStatus.success = this.solveStatus.success && iso.solveStatus.success;
      });

      console.log('numerical result: ' + this.solveStatus.success);
    }

    for (let [p, val] of this.eliminatedParams) {
      p.set(val);
    }

    for (let i = this.substitutedParams.length - 1; i >= 0; i--) {
      let [param, expression] = this.substitutedParams[i];
      param.set(expression.value());
    }
  }

  updateFullyConstrainedObjects() {


    const substitutedParamsLookup =  new Set();
    this.substitutedParams.forEach(([p]) => substitutedParamsLookup.add(p));

    this.validConstraints(c => {

      c.objects.forEach(obj => {

        let allLocked = true;

        obj.visitParams(p => {

          const eliminated = this.eliminatedParams.has(p);
          const substituted = substitutedParamsLookup.has(p);
          const iso = this.paramToIsolation.get(p);
          if (!eliminated && !substituted && (!iso || !iso.fullyConstrained)) {
            allLocked = false;
          }
        });

        obj.fullyConstrained = allLocked;
      });
    });
  }


  canBeAdded(subjectParams, ancestorParams) {

    for (let p of subjectParams) {
      if (!this.ownParams.has(p) && (!ancestorParams || !ancestorParams.has(p))) {
        return false;
      }
    }

    return true;
  }
}


class Isolation {

  constructor(polynomials) {
    this.polynomials = polynomials;
    this.beingSolvedParams = new Set();
    const residuals = [];

    this.polynomials.forEach(p => residuals.push(p.asResidual()));

    for (let residual of residuals) {
      residual.params.forEach(solverParam => {
        if (!this.beingSolvedParams.has(solverParam)) {
          solverParam.reset(solverParam.objectParam.get());
          this.beingSolvedParams.add(solverParam);
        }
      });
    }
    this.dof = this.beingSolvedParams.size - polynomials.length;

    let penaltyFunction = new PolynomialResidual();
    this.beingSolvedParams.forEach(sp => {
      const param = sp.objectParam;
      if (param.constraints) {
        param.constraints.forEach(pc => penaltyFunction.add(sp, pc))
      }
    });

    if (penaltyFunction.params.length) {
      residuals.push(penaltyFunction);
    }

    this.numericalSolver = prepare(residuals);
  }

  get fullyConstrained() {
    return this.dof === 0;
  }

  solve(rough) {
    this.beingSolvedParams.forEach(solverParam => {
      solverParam.set(solverParam.objectParam.get());
    });

    this.solveStatus = this.numericalSolver.solveSystem(rough);

    this.beingSolvedParams.forEach(solverParam => {
      solverParam.objectParam.set(solverParam.get());
    });
  }

}

class PolynomialResidual {

  params = [];
  functions = [];

  add(param, fn) {
    this.params.push(param);
    this.functions.push(fn);

  }

  error() {
    let err = 0;
    for (let i = 0 ; i < this.params.length; ++i) {
      err += this.functions[i].d0(this.params[i].get());
    }

    return err;
  }

  gradient(out) {
    for (let i = 0 ; i < this.params.length; ++i) {
      out[i] = this.functions[i].d1(this.params[i].get());
    }
  }

}

