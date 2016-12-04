'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/*
    global Firebase
    global angular
    global $
    global ref articlesRef tagsRef usersRef
*/

var mainApp = angular.module('mainApp', ['modalsApp', 'userApp', 'ui.router', 'ui.bootstrap', 'ngAnimate', 'ngSanitize', 'ngStorage', 'firebase', 'textAngular', 'angularSmoothscroll', 'multipleSelect', 'ui.checkbox']).directive('scrollBottom', function () {
    return {
        restrict: 'A',
        scope: {
            schrollBottom: "="
        },
        link: function link(scope, element, attrs) {
            var raw = element[0];
            // 判斷是否拉到最底下了沒
            // 拉到最底下就執行 scope.$apply(attrs.scrolly) => <p scroll-bottom="showMore()"> 執行這個 showMore()
            element.bind('scroll', function () {
                console.log(raw.scrollTop + raw.offsetHeight, raw.scrollHeight);
                if (raw.scrollTop + raw.offsetHeight > raw.scrollHeight) {
                    console.log("I am at the bottom");
                    scope.$apply(attrs.scrolly);
                }
            });
        }
    };
})

// from: http://stackoverflow.com/questions/31814128/multiple-filter-values-in-one-input-field-seperated-by-space-with-angularjs
.filter('filterBySpace', function () {
    return function (array, query, propertys) {

        var parts = query && query.trim().split(/\s+/);
        var keys;
        try {
            keys = Object.keys(array[0] || []);
        } catch (error) {}

        // console.log('parts', parts);    // 分隔之後的 array
        // console.log('keys', keys);      // 所有 key
        // console.log('query', query);    // input 內容
        // console.log('propertys', propertys) // 我自己加的 選擇想要filter的欄位

        if (!parts || !parts.length) return array;

        // every 每個都 true 才回傳true 否則回傳 false
        // some 其中一個 true 就回傳true

        return array.filter(function (obj) {
            return parts.every(function (part) {
                return keys.some(function (key) {
                    // 這邊我自己改的 只 filter propertys 裡有的屬性
                    for (var i = 0; i < propertys.length; i++) {
                        if (key == propertys[i]) {
                            return String(obj[key]).toLowerCase().indexOf(part.toLowerCase()) > -1;
                        }
                    }
                });
            });
        });
    };
}).filter('allKindsPopularArticles', function () {
    return function (articles) {

        var isDepartments = [];

        // 因為已經用順序排過了，所以只要把最初出現的回傳就好

        articles = articles.filter(function (article) {
            if (isDepartments.indexOf(article.departments[0].name) < 0) {
                isDepartments.push(article.departments[0].name);
                return true;
            }
        });
        return articles;
    };
}).config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'templates/home.html',
        controller: function controller($scope, $window, $interval) {
            $scope.setPageTitle('首頁');

            $scope.scrollChangeNav = function (pageSize, totalItems) {

                var changeNav = function changeNav() {
                    if ($("nav").offset().top > 50) {
                        $("nav").removeClass("nav-transparent");
                    } else {
                        if (!$scope.isAuth()) $("nav").addClass("nav-transparent");
                    }
                };
                // off then on
                $scope.$on('$destroy', function () {
                    return angular.element($window).off('scroll', changeNav);
                });
                angular.element($window).on('scroll', changeNav);
            };
        }
    }).state('articles', {
        url: '/articles?searchArticle',
        templateUrl: 'templates/articles.html',
        controller: function controller($scope, $firebaseArray, $state, $stateParams, $window, $timeout) {
            $scope.setPageTitle('文章');
            $scope.searchArticle = $stateParams.searchArticle || "";

            $scope.departmentsArray = $firebaseArray(tagsRef.orderByChild('order').equalTo(1));

            $scope.searchArticleByTag = function (tagName, event) {
                event.stopPropagation();
                $scope.searchArticle = tagName;
            };
            // $firebaseArray(articlesRef.orderByChild('departments'));

            // orderOption
            $scope.currentOrderOption = $scope.orderOptions[0];
            $scope.selectOrderOption = function (orderOption) {
                return $scope.currentOrderOption = orderOption;
            };

            // Pagination
            $scope.currentPage = 1;
            $scope.pageSize = 4;
            $scope.maxSize = 5;
            $scope.articlesArray.$loaded().then(function (articles) {
                return $scope.scrollPagination($scope.pageSize, articles.length);
            });
            $scope.scrollPagination = function (pageSize, totalItems) {
                if (!$scope.isMobile.any()) return;

                var paginationOnScroll = function paginationOnScroll() {
                    $timeout(function () {
                        if ($window.innerHeight + $window.scrollY >= document.body.offsetHeight - $('footer').height() && $scope.pageSize < totalItems) {

                            $scope.pageSize = $scope.pageSize + pageSize;
                        }
                    }, 500);
                };

                // off then on
                $scope.$on('$destroy', function () {
                    return angular.element($window).off('scroll touchmove', paginationOnScroll);
                });
                angular.element($window).on('scroll touchmove', paginationOnScroll);
            };
        }
    }).state('article', {
        url: '/articles/:articleID',
        templateUrl: 'templates/article.html',
        controller: function controller($scope, $state, $stateParams, $firebaseObject, $firebaseArray, $window, $timeout) {
            $scope.setPageTitle('文章內容');
            $scope.articleID = $stateParams.articleID;
            $scope.article = $firebaseObject(articlesRef.child($scope.articleID));

            $scope.isPushed = function (article, UserID) {
                try {
                    return article.pushUserIDs.indexOf(UserID) > -1;
                } catch (error) {
                    return false;
                }
            };
            $scope.pushArticle = function (article, pushUserID) {
                if (!$scope.isAuth()) {
                    $scope.goAuthState('article', { articleID: $scope.articleID });
                    return;
                }
                if ($scope.isPushed(article, pushUserID)) return;
                if ($scope.isAuthSelf(article.creator.uid)) return;

                if (!article.pushUserIDs) article.pushUserIDs = [];
                if (!$scope.user.pushedArticleIDs) $scope.user.pushedArticleIDs = [];

                // notification
                $scope.addNotification(article.creator.uid, {
                    articleID: article.$id,
                    title: '從 ' + article.title + ' 獲得了推',
                    created: $scope.getNowDate(),
                    isRead: false
                });

                $scope.user.pushedArticleIDs.push(article.$id);
                article.pushUserIDs.push(pushUserID);
                $scope.user.$save($scope.user);
                article.$save(article);
            };

            $scope.postComment = function (article, comment) {
                if (comment.trim().length <= 0) return;
                var articleComment = {
                    content: comment,
                    creator: $scope.getUserProfile(),
                    created: $scope.getNowDate()
                };

                if (!article.comments) article.comments = [];
                article.comments.push(articleComment);
                article.$save(article).then(function () {
                    // show success -> hide success
                    $scope.isPostArticleComment = true;
                    $timeout(function () {
                        return $scope.isPostArticleComment = false;
                    }, 1000);
                });

                $scope.articleComment = '';

                // notification 自己留言不新增, addedNotificationUserIDs 為了不要重複傳送
                var addedNotificationUserIDs = [];
                article.comments.forEach(function (commentItem) {
                    if (addedNotificationUserIDs.indexOf(commentItem.creator.uid) >= 0) return;
                    if (commentItem.creator.uid != articleComment.creator.uid) {
                        $scope.addNotification(commentItem.creator.uid, {
                            articleID: article.$id,
                            title: article.title + ' 有了新的留言',
                            created: $scope.getNowDate(),
                            isRead: false
                        });
                        addedNotificationUserIDs.push(commentItem.creator.uid);
                    }
                    if (addedNotificationUserIDs.indexOf(commentItem.creator.uid) >= 0) return;
                    if (commentItem.creator.uid != article.creator.uid) {
                        $scope.addNotification(article.creator.uid, {
                            articleID: article.$id,
                            title: article.title + ' 有了新的留言',
                            created: $scope.getNowDate(),
                            isRead: false
                        });
                    }
                    addedNotificationUserIDs.push(commentItem.creator.uid);
                });
            };

            $scope.getPopverContent = function (article) {
                try {
                    if ($scope.isAuthSelf(article.creator.uid)) return '不能推自己的文章';
                    if ($scope.isPushed(article, $scope.getAuth().uid)) return '已經推過了';
                    return '';
                } catch (e) {
                    return '';
                }
            };

            $scope.reportArticle = function (article) {
                if (!$scope.isAuth()) {
                    $scope.goAuthState('article', { articleID: $scope.articleID });
                    return;
                }
                $scope.openReportArticleModal('md', article);
            };
        }
    }).state('tags', {
        url: '/tags',
        templateUrl: 'templates/tags.html',
        controller: function controller($scope, $firebaseArray, $state, $timeout, $window) {
            $scope.setPageTitle('標籤');

            // 不是 mobile 就可hover
            $scope.isHoverable = !$scope.isMobile.any();
            $scope.isInputDisabled = true;

            // Pagination
            $scope.currentPage = 1;
            $scope.pageSize = 24;
            $scope.maxSize = 5;
            $scope.tagsArray.$loaded().then(function (tags) {
                return $scope.scrollPagination($scope.pageSize, tags.length);
            });
            $scope.scrollPagination = function (pageSize, totalItems) {
                if (!$scope.isMobile.any()) return;

                var paginationOnScroll = function paginationOnScroll() {
                    $timeout(function () {
                        if ($window.innerHeight + $window.scrollY >= document.body.offsetHeight - $('footer').height() && $scope.pageSize < totalItems) {

                            $scope.pageSize = $scope.pageSize + pageSize;
                        }
                    }, 500);
                };

                // off then on
                $scope.$on('$destroy', function () {
                    return angular.element($window).off('scroll touchmove', paginationOnScroll);
                });
                angular.element($window).on('scroll touchmove', paginationOnScroll);
            };

            $scope.searchArticleByTags = function (tags, event) {
                var tagsNames = tags.map(function (tag) {
                    return tag.name;
                });
                var searchArticleString = tagsNames.join(' ');
                $state.go('articles', { searchArticle: searchArticleString });
            };

            $scope.addTag = function (tag) {
                if ($scope.arrayObjectIndexOf($scope.tagSelectedList, tag, 'name') == -1) $scope.tagSelectedList.push(tag);
            };

            $scope.removeTagByIndex = function (index) {
                $scope.tagSelectedList.splice(index, 1);
            };
            $scope.removeTagByTag = function (tag) {
                var index = $scope.arrayObjectIndexOf($scope.tagSelectedList, tag, 'name');
                $scope.tagSelectedList.splice(index, 1);
            };

            $scope.isTagSelected = function (tag) {
                return $scope.arrayObjectIndexOf($scope.tagSelectedList, tag, 'name') >= 0;
            };
        }
    }).state('post-article', {
        url: '/post-article',
        templateUrl: 'templates/post-article.html',
        controller: function controller($scope, $state, $firebaseArray, $firebaseObject, $uibModal, $timeout, $window) {
            $scope.setPageTitle('發表文章');

            $scope.taOptions = {};
            $scope.taOptions.toolbar = [['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'], ['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol'], ['justifyLeft', 'justifyCenter', 'justifyRight'], ['insertLink', 'insertImage', 'insertVideo', 'charcount']];

            // 不是 mobile 就可hover
            $scope.isHoverable = !$scope.isMobile.any();
            $scope.isPost = false;

            $scope.article = {
                title: '',
                content: '',
                creator: $scope.getUserProfile(),
                tags: [],
                created: '',
                comments: [],
                pushUserIDs: [],
                // booUserIDs: [],
                departments: [],
                isLocked: false
            };

            // 照order排序 並只取 order > 0 的
            $scope.stylesArray = $firebaseArray(tagsRef.orderByChild('order').equalTo(0));
            $scope.departmentsArray = $firebaseArray(tagsRef.orderByChild('order').equalTo(1));
            $scope.tagsArray = $firebaseArray(tagsRef.orderByChild('order').equalTo(2));

            // 取出 stylesArray 的每一個都加上 .isSelected = true
            $scope.stylesArray.$loaded().then(function (styles) {
                angular.forEach(styles, function (style, key) {
                    style.isSelected = true;
                });
            });

            // functions
            $scope.newTag = function (size) {
                $scope.openNewTagModal(size, function (newTag) {
                    newTag.order = 2;
                    newTag.keywords = newTag.keywords.trim().split(' ');
                    if (newTag.keywords.indexOf(newTag.name) < 0) newTag.keywords.replace(/  +/g, ' ').push(newTag.name); // 將tagname 加入 keywords

                    tagsRef.child(newTag.name).set(newTag);
                    $scope.article.tags.push(newTag);
                });
            };
            $scope.newDepartment = function (size) {
                $scope.openNewDepartmentModal(size, function (newDepartment) {
                    newDepartment.order = 1;
                    newDepartment.keywords = newDepartment.keywords.replace(/  +/g, ' ').trim().split(' ');
                    if (newDepartment.keywords.indexOf(newDepartment.name) < 0) newDepartment.keywords.push(newDepartment.name); // 將tagname 加入 keywords

                    tagsRef.child(newDepartment.name).set(newDepartment);
                    $scope.article.departments = [];
                    $scope.article.departments.push(newDepartment);
                });
            };

            $scope.postArticle = function (newArticle) {

                if ($scope.postArticleForm.$invalid) return;
                if (!$window.confirm('確定要發表嗎?')) return;

                // copy 不要讓$scope.article 與 article 是有關連性的
                var article = angular.copy(newArticle);

                // 新增style 進 tags
                $scope.stylesArray.forEach(function (style) {
                    if (style.isSelected) {
                        delete style.isSelected;
                        article.tags.push(style);
                    }
                });

                // 新增department(科系)
                // article.tags.push(newArticle.departments[0]);
                article.department = newArticle.departments[0];
                newArticle.departments.forEach(function (department) {
                    article.tags.push(department);
                });

                // 新增 keywords
                article.keywords = [];
                article.tags.forEach(function (tag) {
                    var _article$keywords;

                    (_article$keywords = article.keywords).push.apply(_article$keywords, _toConsumableArray(tag.keywords));
                    article.keywords = $scope.uniqueArray(article.keywords);
                });
                // 新增 created
                article.created = $scope.getNowDate();

                $scope.changeStyle = function () {};

                $scope.articlesArray.$add(article).then(function (ref) {
                    $scope.isPost = true;
                    $timeout(function () {
                        return $state.go('article', { 'articleID': ref.key() });
                    }, 500);
                });
            };
        }
    }).state('edit-article', {
        url: '/edit-article/:articleID',
        templateUrl: 'templates/post-article.html',
        controller: function controller($scope, $state, $stateParams, $firebaseObject, $firebaseArray, $uibModal, $timeout, $window) {
            $scope.setPageTitle('編輯文章');

            $scope.taOptions = {};
            $scope.taOptions.toolbar = [['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'], ['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol'], ['justifyLeft', 'justifyCenter', 'justifyRight'], ['insertLink', 'insertImage', 'insertVideo', 'charcount']];

            $scope.articleID = $stateParams.articleID;
            $scope.isHoverable = !$scope.isMobile.any();

            $scope.stylesArray = $firebaseArray(tagsRef.orderByChild('order').equalTo(0));
            $scope.departmentsArray = $firebaseArray(tagsRef.orderByChild('order').equalTo(1));
            $scope.tagsArray = $firebaseArray(tagsRef.orderByChild('order').startAt(2));
            var articleObject = $firebaseObject(articlesRef.child($scope.articleID));

            // 處理style跟tag
            articleObject.$loaded().then(function (article) {
                $scope.article = article;

                $scope.stylesArray.$loaded().then(function (styles) {
                    angular.forEach(styles, function (style, key) {
                        style.isSelected = $scope.arrayObjectIndexOf(article.tags, style, 'name') > -1; // 判斷style.isSelected
                    });
                    $scope.article.tags = $scope.article.tags.filter(function (tag) {
                        // 從tags刪除 style
                        return tag.order == 2;
                    });
                });
            });

            // 發表文章

            $scope.postArticle = function (article) {

                if ($scope.postArticleForm.$invalid) return;
                if (!$window.confirm('確定要修改嗎?')) return;

                // 新增style 進 tags
                $scope.stylesArray.forEach(function (style) {
                    if (style.isSelected) {
                        delete style.isSelected;
                        article.tags.push(style);
                    }
                });

                // 新增department(科系) 進 tags
                article.departments.forEach(function (department) {
                    article.tags.push(department);
                });

                // 新增 keywords
                article.keywords = [];
                article.tags.forEach(function (tag) {
                    var _article$keywords2;

                    (_article$keywords2 = article.keywords).push.apply(_article$keywords2, _toConsumableArray(tag.keywords));
                    article.keywords = $scope.uniqueArray(article.keywords);
                });
                // 新增 edited
                article.edited = $scope.getNowDate();

                $scope.changeStyle = function () {};

                article.$save(article).then(function (ref) {
                    $scope.isEdit = true;
                    $timeout(function () {
                        return $state.go('article', { 'articleID': ref.key() });
                    }, 200);
                });
            };
        }
    });

    $urlRouterProvider.otherwise('/');
}).controller('MainController', function ($scope, $location, $firebaseArray, $firebaseObject, $state, $uibModal, $rootScope, $window, $timeout, $uibPosition) {
    $scope.setPageTitle = function (pageTitle) {
        $scope.pageTitle = pageTitle;
    };
    $scope.isActive = function (viewLocation) {
        return viewLocation === $location.path();
    };
    $scope.isStateActive = function (stateName) {
        return $state.is(stateName);
    };
    $scope.getAuth = function () {
        return ref.getAuth();
    };
    $scope.isAuth = function () {
        return !!$scope.getAuth();
    };
    $scope.isAuthSelf = function (userID) {
        return $scope.isAuth() && $scope.getAuth().uid == userID;
    };
    $scope.getUserProfile = function () {
        // 資料庫存users, creator的格式
        if (!$scope.isAuth()) return null;
        var profile = $scope.getAuth().facebook || $scope.getAuth().google || null;

        profile.uid = $scope.getAuth().uid;
        profile.provider = $scope.getAuth().provider;

        // 不能放這邊 不然重新登入就消失
        // profile.notifications = [];
        // profile.pushedArticleIDs = [];
        // profile.isLocked = false;
        profile.isSuperUser = false;

        var superUserIDs = ['google:118138672712062784598', 'facebook:1178589075493805', 'fTSce15UEbXyjCI0Gk7tsXKzGT83'];

        if (superUserIDs.indexOf(profile.uid) >= 0) profile.isSuperUser = true;

        delete profile.accessToken;
        return profile;
    };
    $scope.requireAuth = function (redirectState) {
        if (!$scope.isAuth()) $state.go(redirectState);
    };
    $scope.logout = function () {
        delete $scope.user;
        ref.unauth();
        $state.go('home');
    };
    $scope.openLoginModal = function (size, _state, _params) {
        var modalInstance = $uibModal.open({
            animation: true,
            size: size,
            templateUrl: 'templates/modal/login-modal.html',
            controller: 'ModalLoginCtrl',
            resolve: {
                ref: function (_ref) {
                    function ref() {
                        return _ref.apply(this, arguments);
                    }

                    ref.toString = function () {
                        return _ref.toString();
                    };

                    return ref;
                }(function () {
                    return ref;
                }),
                state: function state() {
                    return _state;
                },
                params: function params() {
                    return _params;
                },
                scope: function scope() {
                    return $scope;
                }
            }
        });
        modalInstance.result.then(function (user) {
            $scope.user = user;
        });
    };
    $scope.openNewDepartmentModal = function (size, callback, dismissed) {

        var modalInstance = $uibModal.open({
            animation: true,
            size: size,
            templateUrl: 'templates/modal/new-department-modal.html',
            controller: 'ModalNewDepartmentCtrl',
            resolve: {}
        });

        // cloas modal 之後要做的動作 (新增標籤)
        modalInstance.result.then(callback, dismissed);
    };
    $scope.openNewTagModal = function (size, callback, dismissed) {

        var modalInstance = $uibModal.open({
            animation: true,
            size: size,
            templateUrl: 'templates/modal/new-tag-modal.html',
            controller: 'ModalNewTagCtrl',
            resolve: {}
        });

        // cloas modal 之後要做的動作 (新增標籤)
        modalInstance.result.then(callback, dismissed);
    };
    $scope.openContactModal = function (size) {
        var modalInstance = $uibModal.open({
            animation: true,
            size: size,
            templateUrl: 'templates/modal/contact-modal.html',
            controller: 'ModalContactCtrl',
            resolve: {}
        });
    };
    $scope.openReportArticleModal = function (size, _article) {
        var modalInstance = $uibModal.open({
            animation: true,
            size: size,
            templateUrl: 'templates/modal/report-article-modal.html',
            controller: 'ModalReportArticleCtrl',
            resolve: {
                article: function article() {
                    return _article;
                },
                user: function user() {
                    return $scope.getUserProfile();
                }
            }
        });
    };
    $scope.arrayObjectIndexOf = function (myArray, searchItem, property) {
        for (var i = 0, len = myArray.length; i < len; i++) {
            if (myArray[i][property] === searchItem[property]) return i;
        }
        return -1;
    };
    $scope.uniqueArray = function (array) {
        return [].concat(_toConsumableArray(new Set(array)));
    };
    $scope.goState = function (state, params, event) {
        try {
            event.stopPropagation();
        } catch (e) {}
        $state.go(state, params);
    };
    $scope.goAuthState = function (state, params) {
        if ($scope.isAuth()) $state.go(state, params || {});else $scope.openLoginModal('sm', state, params || {});
    };
    $scope.reconnectFirebase = function () {
        Firebase.goOnline();
    };
    $scope.getNowDate = function () {
        return moment().format('YYYY-MM-DD hh:mm:ss');
    };
    $scope.getFromNow = function (date, format) {
        return moment(date, format).fromNow();
    };
    $scope.changeStyle = function (stylesArray, style) {
        if (style.isSelected) return;

        // 判斷是否全都沒勾
        var isAllFalse = stylesArray.every(function (style) {
            return !style.isSelected;
        });
        if (isAllFalse) {
            stylesArray.forEach(function (styleItem) {
                if (style != styleItem) styleItem.isSelected = true;
            });
        }
    };
    $scope.htmlToPlaintext = function (html) {
        return html ? String(html).replace(/<[^>]+>/gm, '') : '';
    };
    $scope.getStringPosition = function (str, m, index) {
        return str.split(m, index).join(m).length; // getPosition(string, 'ABC', 2) // --> 16
    };
    $scope.cutArticleContent = function (content) {
        return $scope.htmlToPlaintext(content);
    };
    // Pagination
    $scope.pageStartItem = function (size, currentPage) {
        // if($scope.isMobile.any()) return 0;
        return size * (currentPage - 1);
    };
    $scope.addNotification = function (userID, notification) {
        $firebaseObject(usersRef.child(userID)).$loaded().then(function (user) {
            if (!user.notifications) user.notifications = [];
            user.notifications.push(notification);
            user.$save(user);
        });
    };
    $scope.readAllNotifications = function (user, notReadCount) {
        if (notReadCount <= 0) return;
        $timeout(function () {
            user.notifications.forEach(function (notification) {
                return notification.isRead = true;
            });
            $scope.user.$save(user.notifications);
        }, 3000);
    };

    $scope.isMobile = {
        Android: function Android() {
            return !!navigator.userAgent.match(/Android/i);
        },
        BlackBerry: function BlackBerry() {
            return !!navigator.userAgent.match(/BlackBerry/i);
        },
        iOS: function iOS() {
            return !!navigator.userAgent.match(/iPhone|iPad|iPod/i);
        },
        Opera: function Opera() {
            return !!navigator.userAgent.match(/Opera Mini/i);
        },
        Windows: function Windows() {
            return !!navigator.userAgent.match(/IEMobile/i) || !!navigator.userAgent.match(/WPDesktop/i);
        },
        any: function any() {
            return $scope.isMobile.Android() || $scope.isMobile.BlackBerry() || $scope.isMobile.iOS() || $scope.isMobile.Opera() || $scope.isMobile.Windows();
        }
    };

    $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
        $window.scrollTo(0, 0);
    });

    console.log('getAuth:', $scope.getAuth());
    console.log('getUserProfile:', $scope.getUserProfile());

    // check loaded
    $scope.isLoaded = false;
    $firebaseArray(researchRef).$loaded().then(function () {
        return $scope.isLoaded = true;
    });

    // $scope.user
    if ($scope.isAuth()) $scope.user = $firebaseObject(usersRef.child($scope.getAuth().uid));

    $scope.usersArray = $firebaseArray(usersRef);
    $scope.articlesArray = $firebaseArray(articlesRef);
    $scope.tagsArray = $firebaseArray(tagsRef);

    // articles order options
    $scope.orderOptions = [{ name: '發表時間較新', key: 'created', reverse: true }, { name: '推較多', key: 'pushUserIDs.length || 0', reverse: true }, { name: '留言較多', key: 'comments.length || 0', reverse: true }, { name: '發表時間較舊', key: 'created', reverse: false }, { name: '推較少', key: 'pushUserIDs.length || 0', reverse: false }, { name: '留言較少', key: 'comments.length || 0', reverse: false }];

    $scope.init = function () {
        moment.locale('zh-tw');
    };

    $scope.templates = {
        // nav: 'templates/nav.html',
        nav: 'templates/ui-nav.html',
        footer: 'templates/footer.html',
        loading: 'templates/loading/loading.html',
        userLeftNav: 'templates/user/user-left-nav.html',
        userArticlesTemplate: 'templates/user/user-articles-templates.html',
        orderOption: 'templates/order-option-template.html'
    };
});

exports.default = mainApp;

// angular.element(document).ready(function() {
//     return angular.bootstrap(document, ['mainApp']);
// });