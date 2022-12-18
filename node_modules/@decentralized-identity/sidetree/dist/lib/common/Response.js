"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ResponseStatus_1 = require("./enums/ResponseStatus");
/**
 * Contains operations related to `IResponse`.
 */
class Response {
    /**
     * Converts a Sidetree response status to an HTTP status.
     */
    static toHttpStatus(status) {
        switch (status) {
            case ResponseStatus_1.default.Succeeded:
                return 200;
            case ResponseStatus_1.default.BadRequest:
                return 400;
            case ResponseStatus_1.default.Deactivated:
                return 410;
            case ResponseStatus_1.default.NotFound:
                return 404;
            case ResponseStatus_1.default.ServerError:
            default:
                return 500;
        }
    }
}
exports.default = Response;
//# sourceMappingURL=Response.js.map