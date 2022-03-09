import ls from "./GenericExplorer.less";

import React, {useState} from 'react';
import cx from 'classnames';
import {AiFillCaretDown, AiFillCaretRight} from "react-icons/ai";
import {BsDot} from "react-icons/bs";

interface GenericExplorerControlProps {
  title: string;
  onClick: any;
  on: boolean;
  children: any;
}

export function GenericExplorerControl(props: GenericExplorerControlProps) {

  return <span onClick={props.onClick} title={props.title}
               className={cx(ls.onOffButton, ls[ props.on ? 'on' : 'off' ])}>{props.children}</span>
}

interface GenericExplorerNodeProps {
  children: any;
  controls: any;
  label: any;
  selected: boolean;
  defaultExpanded?: boolean;
  expandable: boolean;
  select: any;
}

export function GenericExplorerNode(props: GenericExplorerNodeProps) {

  const [expanded, setExpanded] = useState(!!props.defaultExpanded);
  const expandable = props.expandable;

  const toggle = expandable ? (() => setExpanded(expanded => !expanded)) : undefined;

  return <>
    <div className={ls.objectItem}>
    <span className={expandable ? ls.expandHandle : ls.expandHandleInactive} onClick={toggle}>
      {expandable ? (expanded ? <AiFillCaretDown/> : <AiFillCaretRight/>)
        : <BsDot/>}
    </span>
      {props.controls}

      <span onClick={props.select}
            className={cx(ls.objectLabel, props.selected && ls.selected)}>
      {props.label}
    </span>

      <span className={ls.menuButton}>...</span>

    </div>
    {expanded && <div style={{paddingLeft: 10}}>
      {props.children}
    </div>}
  </>;
}
