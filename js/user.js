/*
    global angular
    global Firebase
*/
var userApp = angular.module('userApp', ['ui.router',
                                         'ui.bootstrap', 
                                         'firebase'])


.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('user', {
            url: '/user/:userID',
            templateUrl: 'templates/user/user.html',
            controller: function($scope, $state, $stateParams, $firebaseArray, $firebaseObject, $location, $timeout, $window) {
                if($scope.isStateActive('user')) $state.go('user.articles', { userID: $scope.userID });
                $scope.setPageTitle('user');
                $scope.userID = $stateParams.userID;
                let userSyncObject = $firebaseObject(usersRef.child($scope.userID));
                
                userSyncObject.$loaded().then(function(user){
                    $scope.user = user;
                });
                
                $scope.searchUserArticleByTag = (tagName) =>  $scope.searchUserArticle = tagName;
                
                // orderOption
                $scope.currentOrderOption = $scope.orderOptions[0];
                $scope.selectOrderOption = (orderOption) => $scope.currentOrderOption = orderOption;
                
                // Pagination 
                $scope.currentPage = 1;
                $scope.pageSize = 10;
                $scope.maxSize = 5;
                // userSyncObject.$loaded().then((articles) => $scope.scrollPagination($scope.articlesPageSize, articles.length));
                $scope.scrollPagination = function(pageSize, totalItems) {
                    if(!$scope.isMobile.any()) return;
                    
                    let paginationOnScroll = () => {
                        $timeout(() => {
                            if ($window.innerHeight + $window.scrollY >= document.body.offsetHeight - $('footer').height() - $('.user-articles-table').height() && 
                                $scope.articlesPageSize < totalItems) {
                                
                                $scope.articlesPageSize = $scope.articlesPageSize + pageSize;
                            }
                        }, 500);
                    }
                    
                    // off then on
                    $scope.$on('$destroy', () => angular.element($window).off('scroll touchmove', paginationOnScroll));
                    angular.element($window).on('scroll touchmove', paginationOnScroll);
                }
            }
        })
        .state('user.articles', {
            url: '/articles',
            templateUrl: 'templates/user/user-articles.html',
            controller: function($scope, $state, $firebaseArray) {
                $scope.setPageTitle('articles');
                
                $scope.articlesArray = [];
                
                let articlesArray = $firebaseArray(articlesRef.orderByChild('creator'));
                articlesArray.$loaded().then(function(articles){
                    angular.forEach(articles, function(article, key) {
                        if(article.creator.uid == $scope.userID)
                            $scope.articlesArray.push(article);
                    })
                    // 滑動換頁
                    $scope.scrollPagination($scope.pageSize, articles.length);
                });
            }
        })
        .state('user.push-articles', {
            url: '/push-articles',
            templateUrl: 'templates/user/user-push-articles.html',
            controller: function($scope, $state, $firebaseArray) {
                $scope.setPageTitle('push articles');
                
                $scope.articlesArray = [];
                let articlesArray = $firebaseArray(articlesRef);
                
                articlesArray.$loaded().then(function(articles){
                    angular.forEach(articles, function(article, key) {
                        if($scope.user.pushedArticleIDs.indexOf(article.$id) > -1)
                            $scope.articlesArray.push(article);
                    })
                    // 滑動換頁
                    $scope.scrollPagination($scope.pageSize, articles.length);
                });
            }
        })
        .state('user.profile', {
            url: '/profile',
            templateUrl: 'templates/user/user-profile.html',
            controller: function($scope, $state, $firebaseObject) {
                if(!$scope.isAuthSelf($scope.userID)) $state.go('user.articles' , { userID: $scope.userID });
                $scope.setPageTitle('你的資料');
                
                let userSyncObject = $firebaseObject(usersRef.child($scope.userID));
                
                $scope.isDisplayNameChange = false;
                
                $scope.changeDisplayName = function(name) {
                    userSyncObject.displayName = name
                    userSyncObject.$save();
                    $scope.isDisplayNameChange = true;
                }
            }
        })
        .state('user.notifications', {
            url: '/notifications',
            templateUrl: 'templates/user/user-notifications.html',
            controller: function($scope, $state) {
                if(!$scope.isAuthSelf($scope.userID)) $state.go('user.articles' , { userID: $scope.userID });
                $scope.setPageTitle('所有通知');
                
                $scope.currentPage = 1;
                $scope.pageSize = 30;
                $scope.maxSize = 5;
            }
        })
})

export default userApp;
