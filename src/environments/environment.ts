// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
    production: false,
    google: 'AIzaSyBB7Ozb8V6ujJm4ViERlBnSU2qFokMTazQ',
    backend: 'https://canimap.melard.fr',
    auth: {
        redirect: 'http://localhost:4200/login',
        id: 'HXGX610IWqnjdjz3EgF0O4qXHuL4ZSbJ'
    }
};
