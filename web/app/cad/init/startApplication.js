import * as LifecyclePlugin from './lifecyclePlugin';
import * as AppTabsPlugin from '../dom/appTabsPlugin';
import * as DomPlugin from '../dom/domPlugin';
import * as PickControlPlugin from '../scene/controls/pickControlPlugin';
import * as MouseEventSystemPlugin from '../scene/controls/mouseEventSystemPlugin';
import * as ScenePlugin from '../scene/scenePlugin';
import * as SelectionMarkerPlugin from '../scene/selectionMarker/selectionMarkerPlugin';
import * as ActionSystemPlugin from '../actions/actionSystemPlugin';
import * as UiPlugin from '../dom/uiPlugin';
import * as MenuPlugin from '../dom/menu/menuPlugin';
import * as KeyboardPlugin from '../keyboard/keyboardPlugin';
import * as WizardPlugin from '../craft/wizard/wizardPlugin';
import * as PreviewPlugin from '../preview/previewPlugin';
import * as OperationPlugin from '../craft/operationPlugin';
import * as ExtensionsPlugin from '../craft/extensionsPlugin';
import * as CadRegistryPlugin from '../craft/cadRegistryPlugin';
import * as CraftPlugin from '../craft/craftPlugin';
import * as CraftUiPlugin from '../craft/craftUiPlugin';
import * as StoragePlugin from '../storagePlugin';
import * as ProjectPlugin from '../projectPlugin';
import * as SketcherPlugin from '../sketch/sketcherPlugin';
import * as ExportPlugin from '../exportPlugin';
import * as TpiPlugin from '../tpi/tpiPlugin';
import * as ViewSyncPlugin from '../scene/viewSyncPlugin';
import * as E0Plugin from '../craft/e0/e0Plugin';

import PartModellerPlugins from '../part/partModelerPlugins';

import context from 'context';

import startReact from "../dom/startReact";

export default function startApplication(callback) {

  let applicationPlugins = PartModellerPlugins;
  
  let preUIPlugins = [
    LifecyclePlugin,
    ProjectPlugin,
    StoragePlugin,
    AppTabsPlugin,
    ActionSystemPlugin,
    UiPlugin,
    MenuPlugin,
    KeyboardPlugin,
    OperationPlugin,
    CraftPlugin,
    ExtensionsPlugin,
    WizardPlugin,
    PreviewPlugin,
    CraftUiPlugin,
    CadRegistryPlugin,
    ExportPlugin,
    TpiPlugin,
    E0Plugin
  ];
  
  let plugins = [
    DomPlugin,
    ScenePlugin,
    MouseEventSystemPlugin,
    PickControlPlugin,
    SelectionMarkerPlugin,
    SketcherPlugin,
    ...applicationPlugins,
    ViewSyncPlugin
  ];
  
  let allPlugins = [...preUIPlugins, ...plugins];

  defineStreams(allPlugins, context);
  
  activatePlugins(preUIPlugins, context);

  startReact(context, () => {
    activatePlugins(plugins, context);
    context.services.lifecycle.declareAppReady();
    context.services.viewer.render();
    callback(context);
  });
}

export function defineStreams(plugins, context) {
  for (let plugin of plugins) {
    if (plugin.defineStreams) {
      plugin.defineStreams(context);
    }
  }
}

export function activatePlugins(plugins, context) {
  for (let plugin of plugins) {
    plugin.activate(context);
  }
}

