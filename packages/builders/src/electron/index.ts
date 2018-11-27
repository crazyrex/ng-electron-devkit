import {
    BuilderContext,
    BuilderConfiguration,
    BuildEvent
} from "@angular-devkit/architect";
import {getSystemPath, normalize, Path, resolve, virtualFs} from '@angular-devkit/core';
import {Observable, of} from "rxjs";
import * as fs from 'fs';
import {BrowserBuilder, NormalizedBrowserBuilderSchema} from "@angular-devkit/build-angular";
import {ElectronBuilderSchema} from "./schema";
import {runModuleAsObservableFork} from "@angular-devkit/build-angular/src/utils";
import {concatMap} from 'rxjs/operators';

import {BuildElectronArgs} from "./build-electron-args";
import {buildWebpackConfig, compileElectronEntryPoint} from '../common/common';


export class ElectronBuilder extends BrowserBuilder {


    constructor(public context: BuilderContext) {
        super(context);
    }

    run(builderConfig: BuilderConfiguration<ElectronBuilderSchema>): Observable<BuildEvent> {
        return of(null).pipe(
            concatMap(() => super.run(builderConfig)),
            concatMap(() => this.compileElectronEntryPoint(builderConfig)),
            concatMap(() => this.packElectronApplication(builderConfig))
        )
    }

    buildWebpackConfig(
        root: Path,
        projectRoot: Path,
        host: any,
        options: NormalizedBrowserBuilderSchema
    ): any {
        let browserConfig = super.buildWebpackConfig(root, projectRoot, host, options);
        return buildWebpackConfig(browserConfig);
    }

    compileElectronEntryPoint(builderConfig: BuilderConfiguration<ElectronBuilderSchema>): Observable<BuildEvent> {
        return compileElectronEntryPoint(this.context, builderConfig.options, builderConfig.options.outputPath)
    }

    packElectronApplication(builderConfig: BuilderConfiguration<ElectronBuilderSchema>): Observable<BuildEvent> {

        const root = this.context.workspace.root;

        let args: BuildElectronArgs = {
            projectDir: getSystemPath(resolve(root, normalize(builderConfig.options.electronProjectDir))),
            platforms: builderConfig.options.electronPlatforms
        };

        this.context.logger.info(
            `Running electron-builder with projectDir: ${args.projectDir} and platforms: ${args.platforms}`
        );

        return runModuleAsObservableFork(
            root,
            '@ng-electron-devkit/builders/src/electron/build-electron',
            'build',
            [
                args
            ],
        );
    }
}


export default ElectronBuilder;