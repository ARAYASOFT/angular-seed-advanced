import * as gulp from 'gulp';
import * as gulpLoadPlugins from 'gulp-load-plugins';
import * as merge from 'merge-stream';
import * as fs from 'fs';
import * as path from 'path';

import Config from '../../config';
import { makeTsProject, TemplateLocalsBuilder } from '../../utils';
import { TypeScriptTask } from '../typescript_task';

const plugins = <any>gulpLoadPlugins();

const jsonSystemConfig = JSON.stringify(Config.TNS_CONFIG);

/**
 * Executes the build process, transpiling the TypeScript files (except the spec and e2e-spec files) for the development
 * environment.
 */
export =
  class BuildJsDev extends TypeScriptTask {
    run() {
      const src = [
        '**/*.ts',
        'mobile/**/*.ts',
        'app/**/*.ts',
        '!**/*.spec.ts',
        '!app/**/*.spec.ts',
        '!**/*.e2e-spec.ts',
        '!app/**/*.e2e-spec.ts',
        '!app/modules/test/**/*',
        `!**/${Config.NG_FACTORY_FILE}.ts`,
      ];

      const tsProject = makeTsProject({}, Config.TNS_APP_SRC);

      const result = gulp.src([
        ...src,
        '!**/*.aot.ts',
      ], {
          base: Config.TNS_APP_SRC,
          cwd: Config.TNS_APP_SRC,
        })
        .pipe(plugins.sourcemaps.init())
        .pipe(tsProject());

      const template = (<any>Object).assign(
        // new TemplateLocalsBuilder().withStringifiedSystemConfigDev().build(), {
        //   SYSTEM_CONFIG_TNS: jsonSystemConfig
        // },
        new TemplateLocalsBuilder().withStringifiedSystemConfigDev().build(), {
          TNS_CONFIG: jsonSystemConfig
        },
      );

    //   const envConfig = Object.assign({}, baseConfig, envOnlyConfig);
    // let locals = Object.assign({},
    //   Config,
    //   { ENV_CONFIG: this.stringifyEnvConfig ? JSON.stringify(envConfig) : envConfig }
    // );
    // if (this.stringifySystemConfigDev) {
    //   Object.assign(locals, {SYSTEM_CONFIG_DEV: JSON.stringify(Config.SYSTEM_CONFIG_DEV)});
    // }
    // return locals;

      const transpiled = result.js
        .pipe(plugins.sourcemaps.write())
        // Use for debugging with Webstorm/IntelliJ
        // https://github.com/mgechev/angular-seed/issues/1220
        //    .pipe(plugins.sourcemaps.write('.', {
        //      includeContent: false,
        //      sourceRoot: (file: any) =>
        //        relative(file.path, PROJECT_ROOT + '/' + APP_SRC).replace(sep, '/') + '/' + APP_SRC
        //    }))

        // TODO: template does not work on ns-app.service - not sure why - disabled for now
        // .pipe(plugins.template(template, {})).on('error', console.error.bind(console))
        .pipe(gulp.dest(Config.TNS_APP_DEST));

      const copy = gulp.src(src, {
        base: Config.TNS_APP_SRC,
        cwd: Config.TNS_APP_SRC,
      })
        .pipe(gulp.dest(Config.TNS_APP_DEST));

      fs.writeFileSync(path.join(Config.TNS_APP_DEST, 'build-config.json'), JSON.stringify(template));

      return merge(transpiled, copy);
    }
  };


