"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Return code for a content fetch.
 */
var FetchResultCode;
(function (FetchResultCode) {
    FetchResultCode["CasNotReachable"] = "cas_not_reachable";
    FetchResultCode["InvalidHash"] = "content_hash_invalid";
    FetchResultCode["MaxSizeExceeded"] = "content_exceeds_maximum_allowed_size";
    FetchResultCode["NotAFile"] = "content_not_a_file";
    FetchResultCode["NotFound"] = "content_not_found";
    FetchResultCode["Success"] = "success";
})(FetchResultCode || (FetchResultCode = {}));
exports.default = FetchResultCode;
//# sourceMappingURL=FetchResultCode.js.map