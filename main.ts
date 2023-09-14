import { table } from "table";

import * as api from "./packages/api/package.json";
import * as blockchain from "./packages/blockchain/package.json";
import * as bls from "./packages/bls/package.json";
import * as cli from "./packages/cli/package.json";
import * as common from "./packages/common/package.json";
import * as contracts from "./packages/contracts/package.json";
import * as core from "./packages/core/package.json";
import * as database from "./packages/database/package.json";
import * as ipc from "./packages/ipc/package.json";
import * as network from "./packages/network/package.json";
import * as rpc from "./packages/rpc/package.json";
import * as structure from "./packages/structure/package.json";
import * as utils from "./packages/utils/package.json";
import * as vm from "./packages/vm/package.json";
import * as wallet from "./packages/wallet/package.json";

let reiModulesArray = [
  api,
  blockchain,
  bls,
  cli,
  common,
  contracts,
  core,
  database,
  ipc,
  network,
  rpc,
  structure,
  utils,
  vm,
  wallet,
];

let reiModules = new Map();
reiModulesArray.forEach((reiModule) => {
  reiModules.set(reiModule.name, reiModule);
});

let reiModuleVersions = new Map();
let reiModuleDependBy = new Map();
reiModulesArray.forEach((reiModule) => {
  for (let [dependency, version] of Object.entries(reiModule.dependencies)) {
    if (dependency.startsWith("@rei-network/")) {
      if (!reiModuleVersions.has(dependency)) {
        reiModuleVersions.set(dependency, new Set([version]));
        reiModuleDependBy.set(dependency, new Set([reiModule.name]));
      } else {
        reiModuleVersions.get(dependency).add(version);
        reiModuleDependBy.get(dependency).add(reiModule.name);
      }
    }
  }
});

function checkConflictReiModuleVersion() {
  for (let [reiModule, versions] of Object.entries(reiModuleVersions)) {
    if (versions.length > 1) {
      console.log(
        "detect confilict module versions, module: ",
        reiModule,
        ", versions: ",
        versions
      );
      return false;
    }
  }
  return true;
}

let modulesNeedRelease = new Set();
function findReiModulesNeedRelease(updatedReiModules: Set<string>) {
  updatedReiModules.forEach((updatedReiModule) => {
    modulesNeedRelease.add(updatedReiModule);
    if (reiModuleDependBy.has(updatedReiModule)) {
      findReiModulesNeedRelease(reiModuleDependBy.get(updatedReiModule));
    }
  });
}

// TODO: input by git client
let updatedReiModules = new Set(["@rei-network/common", "@rei-network/bls"]);
findReiModulesNeedRelease(updatedReiModules);

let versionsToUpgradeReview = [["module", "current version", "target version"]];
modulesNeedRelease.forEach((moduleNeedRelease) => {
  const reiModule = reiModules.get(moduleNeedRelease);
  versionsToUpgradeReview.push([
    reiModule.name,
    reiModule.version,
    "TODO: input manually",
  ]);
});

console.log(table(versionsToUpgradeReview));
