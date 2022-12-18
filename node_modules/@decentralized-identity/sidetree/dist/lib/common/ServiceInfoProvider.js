"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Encapsulates the functionality to get the information about the service such as
 * version info.
 */
class ServiceInfoProvider {
    constructor(serviceName) {
        this.serviceName = serviceName;
    }
    /**
     * Gets the service version from the package.json file.
     */
    getServiceVersion() {
        return {
            name: this.serviceName,
            version: ServiceInfoProvider.packageJson.version
        };
    }
}
exports.default = ServiceInfoProvider;
ServiceInfoProvider.packageJson = require('../../package.json');
//# sourceMappingURL=ServiceInfoProvider.js.map