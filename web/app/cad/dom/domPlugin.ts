import {contributeComponent} from './components/ContributedComponents';
import {Plugin} from "plugable/pluginSystem";
import {AppTabsService} from "cad/dom/appTabsPlugin";

export interface DomService {

  viewerContainer: HTMLElement,

  contributeComponent: (comp: () => JSX.Element) => void

}

interface DomPluginInputContext {
  appTabsService: AppTabsService;
  services: any;
}

export interface DomPluginContext {
  domService: DomService;
}

type DomPluginWorkingContext = DomPluginInputContext&DomPluginContext;

declare module 'context' {
  interface ApplicationContext extends DomPluginContext {}
}

export const DomPlugin: Plugin<DomPluginInputContext, DomPluginContext, DomPluginWorkingContext> = {

  inputContextSpec: {
    appTabsService: 'required',
    services: 'required',
  },

  outputContextSpec: {
    domService: 'required',
  },

  activate(ctx: DomPluginInputContext&DomPluginContext) {
    ctx.domService = {
      viewerContainer: document.getElementById('viewer-container'),
      contributeComponent
    };

    ctx.services.dom = ctx.domService;

    ctx.appTabsService.tabs$.attach(({activeTab}) => {
      if (activeTab === 0) {
        ctx.services.viewer.sceneSetup.updateViewportSize();
      }
    });
  },

}


