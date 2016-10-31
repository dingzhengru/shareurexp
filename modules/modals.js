'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/*
    global angular
*/

var modalsApp = angular.module('modalsApp', ['ui.router', 'ui.bootstrap', 'firebase']);

// .config(function($stateProvider, $urlRouterProvider) {
//     $stateProvider
//         .state('home', {
//             url: '/',
//             templateUrl: 'templates/home.html',
//             controller: function($scope, $http, $location, $localStorage, $timeout) {
//                 $scope.setPageTitle('Home');

//             }
//         })
// });

// Login Modal

modalsApp.controller('ModalLoginCtrl', function ($scope, $uibModal, $uibModalInstance, $firebaseAuth, $firebaseObject, $state, $timeout, ref, state, params, scope) {

    $scope.isLogin = false;

    var auth = $firebaseAuth(ref);

    $scope.facebookLogin = function () {

        auth.$authWithOAuthPopup('facebook', { remember: 'default', scope: 'public_profile, email' }).then(function (authData) {
            $scope.isLogin = true;
            // 可利用token 拿取各scope資料 ex: https://graph.facebook.com/v2.5/me/friends?access_token=...

            var userObject = $firebaseObject(usersRef.child(authData.uid));
            var user = void 0;
            userObject.$loaded().then(function () {
                if (userObject.email) {
                    userObject.email = authData.facebook.email;
                    userObject.displayName = authData.facebook.displayName;
                    userObject.$save(userObject);

                    user = userObject;
                } else {
                    var profile = scope.getUserProfile();
                    usersRef.child(profile.uid).set(profile);

                    user = profile;
                }
                $timeout(function () {
                    if (state) $state.go(state, params);
                    $scope.ok(user);
                }, 500);
            });
        }).catch(function (error) {
            console.log('Authentication failed:', error);
        });
    };
    $scope.googleLogin = function () {
        auth.$authWithOAuthPopup('google', { remember: 'default', scope: 'profile, email' }).then(function (authData) {
            $scope.isLogin = true;

            var userObject = $firebaseObject(usersRef.child(authData.uid));
            var user = void 0;
            userObject.$loaded().then(function () {
                if (userObject.email) {
                    userObject.email = authData.google.email;
                    userObject.displayName = authData.google.displayName;
                    userObject.$save(userObject);

                    user = userObject;
                } else {
                    var profile = scope.getUserProfile();
                    usersRef.child(profile.uid).set(profile);

                    user = profile;
                }
                $timeout(function () {
                    if (state) $state.go(state, params);
                    $scope.ok(user);
                }, 500);
            });
        }).catch(function (error) {
            console.log('Authentication failed:', error);
        });
    };

    $scope.ok = function (user) {
        return $uibModalInstance.close(user);
    };
    $scope.cancel = function () {
        return $uibModalInstance.dismiss('cancel');
    };
});

// New Tag Modal

modalsApp.controller('ModalNewTagCtrl', function ($scope, $uibModal, $uibModalInstance) {

    $scope.ok = function (tag) {
        if ($scope.newTagForm.$invalid) return;

        $uibModalInstance.close(tag);
    };

    $scope.cancel = function () {
        return $uibModalInstance.dismiss('cancel');
    };
});

// New Department Modal

modalsApp.controller('ModalNewDepartmentCtrl', function ($scope, $uibModal, $uibModalInstance) {

    $scope.ok = function (department) {
        if ($scope.newDepartmentForm.$invalid) return;

        $uibModalInstance.close(department);
    };

    $scope.cancel = function () {
        return $uibModalInstance.dismiss('cancel');
    };
});

modalsApp.controller('ModalContactCtrl', function ($scope, $http, $uibModal, $uibModalInstance, $firebaseAuth, $state, $timeout) {

    $scope.contact = {};
    $scope.taOptions = {};
    $scope.taOptions.toolbar = [['h1', 'h2', 'h3', 'h4', 'p'], ['bold', 'italics', 'underline'], ['justifyLeft', 'justifyCenter', 'justifyRight']];

    $scope.isSendSuccess = false;

    $scope.ok = function () {
        // $http.get('http://university-research-dingzhengru.c9users.io:8080/contact-us').success(() => console.log(123) );
        $http.post('http://university-research-dingzhengru.c9users.io:8080/contact-us', { 'contact': $scope.contact }).success(function () {
            $scope.isSendSuccess = true;
            $timeout(function () {
                return $uibModalInstance.close([]);
            }, 500);
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

modalsApp.controller('ModalReportArticleCtrl', function ($scope, $http, $uibModal, $uibModalInstance, $firebaseAuth, $state, $timeout, article, user) {

    $scope.report = {};
    $scope.report.user = user;
    $scope.report.article = article;
    $scope.isSendSuccess = false;

    $scope.ok = function (report) {
        $http.post('http://shareurexp.tw/report-article', { 'report': report }).success(function () {
            $scope.isSendSuccess = true;
            $timeout(function () {
                return $uibModalInstance.close([]);
            }, 500);
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
});

exports.default = modalsApp;