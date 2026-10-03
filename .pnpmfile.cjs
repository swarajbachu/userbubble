"use strict";
const styles = ["bulk", "duotone", "solid"];

module.exports = {
  hooks: {
    updateConfig(config) {
      // Keep source imports and manifests on Pro. Community installs resolve
      // the same public icon names to the free pack without registry access.
      const token = process.env.HUGEICONS_TOKEN?.trim();
      const overrides = { ...config.overrides };
      for (const style of styles) {
        overrides[`@hugeicons-pro/core-${style}-rounded`] = token
          ? "^4.0.0"
          : "npm:@hugeicons/core-free-icons@^3.0.0";
      }
      return {
        ...config,
        overrides,
        rawConfig: {
          ...config.rawConfig,
          ...(token ? { "//npm.hugeicons.com/:_authToken": token } : {}),
        },
      };
    },
  },
};
