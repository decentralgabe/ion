"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
class Fixture {
    static writeFixtureToDisk(filePath, fixture) {
        fs.writeFileSync(path.resolve(__dirname, '../../tests/vectors/' + filePath), JSON.stringify(fixture, null, 2));
    }
    ;
    // this function should not be necessary if fixtures are well designed
    // however, it is useful while they remain randomly generated.
    static fixtureDriftHelper(received, expected, pathToFixture, overwrite = false) {
        const match = JSON.stringify(received) === JSON.stringify(expected);
        if (!match) {
            // console.error('Fixture Drift!');
            // console.warn('Consider updating JSON to: ');
            // console.warn(JSON.stringify(received, null, 2));
            if (overwrite) {
                Fixture.writeFixtureToDisk(pathToFixture, received);
            }
        }
    }
}
exports.default = Fixture;
//# sourceMappingURL=Fixture.js.map