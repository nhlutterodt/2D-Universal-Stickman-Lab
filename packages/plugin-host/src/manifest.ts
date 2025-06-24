/**
 * PluginManifest JSON schema.
 * @lab-docgen
 */
export interface PluginManifest {
  name: string;
  version: string;
  main: string;
  capabilities: string[];
  panels?: string[];
  toolbar?: string[];
  generators?: string[];
  exporters?: string[];
  behaviours?: string[];
}
