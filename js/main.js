/* global angular */

import modalsApp from './modals.js';
import userApp from './user.js';
import mainApp from './app.js';



angular.element(document).ready(function() {
    return angular.bootstrap(document, ['mainApp']);
});