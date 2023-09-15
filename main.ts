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

export let packages = [
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

export class ReleaseHelper {
  packageVersions: Map<string, string>;
  packageDependByPackages: Map<string, Map<string, string>>;
  packagesNeedRelease: Set<string>;

  constructor() {
    this.packageVersions = new Map();
    this.packageDependByPackages = new Map();
    this.packagesNeedRelease = new Set();

    packages.forEach((pkg) => {
      this.packageVersions.set(pkg.name, pkg.version);

      for (let [dependency, version] of Object.entries(pkg.dependencies)) {
        if (dependency.startsWith("@rei-network/")) {
          if (!this.packageDependByPackages.has(dependency)) {
            let dependByPackages = new Map();
            dependByPackages.set(pkg.name, version);
            this.packageDependByPackages.set(dependency, dependByPackages);
          } else {
            this.packageDependByPackages.get(dependency).set(pkg.name, version);
          }
        }
      }
    });
  }

  private checkConflictPackageVersions() {
    for (let [pkg, dependByPackages] of this.packageDependByPackages) {
      // console.debug(
      //   "package: ",
      //   pkg,
      //   " depend by packages: ",
      //   dependByPackages
      // );

      let dependVersions = new Set(dependByPackages.values());
      if (dependVersions.size > 1) {
        console.error(
          "detect conflict module dependencies, package: ",
          pkg,
          ". which being depended by: ",
          dependByPackages
        );
        return false;
      }
    }

    return true;
  }

  private findPackagesNeedRelease(packagesUpdated: Set<string>) {
    packagesUpdated.forEach((packageUpdated) => {
      this.packagesNeedRelease.add(packageUpdated);

      if (this.packageDependByPackages.has(packageUpdated)) {
        this.findPackagesNeedRelease(
          new Set(this.packageDependByPackages.get(packageUpdated).keys())
        );
      }
    });
  }

  public releaseReview(packagesUpdated: Set<string>) {
    console.debug(
      "to resolve packages need to release by updated packages: ",
      packagesUpdated
    );

    if (!this.checkConflictPackageVersions()) {
      return;
    }

    this.findPackagesNeedRelease(packagesUpdated);

    let review = [["module", "current version", "target version"]];

    for (let pkg of this.packagesNeedRelease) {
      if (!this.packageVersions.has(pkg)) {
        console.error(
          "package: ",
          pkg,
          "'s json not imported, is it a new package?"
        );
        return;
      }

      review.push([pkg, this.packageVersions.get(pkg), "TODO: input manually"]);
    }

    console.log(table(review));
  }
}

let packagesUpdated = new Set(process.argv.slice(2));
const helper = new ReleaseHelper();
helper.releaseReview(packagesUpdated);
