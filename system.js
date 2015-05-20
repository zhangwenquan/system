"use strict";

var Q = require("q");
var FS = require("fs");
var Path = require("path");
var Location = require("./location");
var CommonSystem = require("./common-system");

// TODO dependency injection

module.exports = NodeSystem;

function NodeSystem(location, description, options) {
    var self = this;
    CommonSystem.call(self, location, description, options);
}

NodeSystem.prototype = Object.create(CommonSystem.prototype);
NodeSystem.prototype.constructor = NodeSystem;

NodeSystem.prototype.read = function read(location, charset) {
    var self = this;
    var deferred = Q.defer();
    var path = Location.toPath(location);
    return Q.ninvoke(FS, "readFile", path, charset || "utf8");
};

NodeSystem.findSystem = function findSystem(directory) {
    var self = this;
    if (directory === Path.dirname(directory)) {
        return Q.reject(new Error("Can't find package"));
    }
    var descriptionLocation = Path.join(directory, "package.json");
    return Q.ninvoke(FS, "stat", descriptionLocation)
    .then(function (stat) {
        return stat.isFile();
    }, function (error) {
        return false;
    }).then(function (isFile) {
        if (isFile) {
            return directory;
        } else {
            return self.findSystem(Path.dirname(directory));
        }
    });
};

NodeSystem.findSystemLocationAndModuleId = function findSystemLocationAndModuleId(path) {
    var self = this;
    path = Path.resolve(process.cwd(), path);
    var directory = Path.dirname(path);
    return self.findSystem(directory)
    .then(function (packageDirectory) {
        var modulePath = Path.relative(packageDirectory, path);
        return {
            location: self.directoryPathToLocation(packageDirectory),
            id: modulePath
        };
    }, function (error) {
        throw new Error("Can't find package: " + path);
    });
};

NodeSystem.loadSystem = function loadSystem(location, options) {
    var self = this;
    return self.prototype.loadSystemDescription(location)
    .then(function (description) {
        return new self(location, description, options);
    });
};
