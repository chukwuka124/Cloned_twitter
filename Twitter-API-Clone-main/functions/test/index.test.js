// Chai is a commonly used library for creating unit test suites. It is easily extended with plugins.
const chai = require('chai');
const assert = chai.assert;

// Sinon is a library used for mocking or verifying function calls in JavaScript.
const sinon = require('sinon');
const projectConfig = {
    apiKey: "AIzaSyBg2-vlcdRLK6uQPiX4wuIvBLpGX7itFM4",
    authDomain: "twitter-api-clone-d7804.firebaseapp.com",
    databaseURL: "https://twitter-api-clone-d7804-default-rtdb.firebaseio.com",
    projectId: "twitter-api-clone-d7804",
    storageBucket: "twitter-api-clone-d7804.appspot.com",
    messagingSenderId: "722255557055",
    appId: "1:722255557055:web:f4361e74faf3197d73310a",
    measurementId: "G-M4TZSRN3Q1"
};
const admin = require('firebase-admin');
const test = require('firebase-functions-test')(projectConfig, '../twitter-api-clone-d7804-firebase-adminsdk-osgz9-156bd4fe52.json');


describe('Cloud Functions', () => {
    let myFunctions;

    before(() => {
        //admin.initializeApp();
        myFunctions = require('../index');
    });

    after(() => {
        test.cleanup();
    });
    switch ('retweet') {//PUT THE NAME OF THE FUNTION YOU WANT TO TEST IN HERE
        case 'userRegistration': {
            describe('userRegistration', () => {
                it('it should create a new user with paramaters', (done) => {

                    const req = {
                        body: {
                            email: 'Deku@gmail.com',
                            username: 'OneForAll5',
                            password: 'Deku123',
                        }
                    };

                    const res = {
                        status: (status) => {
                            return {
                                send: (responseObject) => {
                                    assert.equal(responseObject.statusMessage, "User created");
                                    assert.equal(status, 200);
                                    //done() is to be triggered to finish the function
                                    done();
                                },
                            }

                        }
                    };
                    myFunctions.userRegistration(req, res);
                });
            });
        } break;
        case 'userLogin': {
            describe('userLogin', () => {
                it('it should log a user in', (done) => {

                    const req = {
                        body: {
                            username: 'TheLastBen10',
                            password: 'Ben10',
                        }
                    };

                    const res = {
                        status: (status) => {
                            return {
                                send: (responseObject) => {
                                    assert.equal(responseObject.statusMessage, "User logged in");
                                    assert.equal(status, 200);
                                    //done() is to be triggered to finish the function
                                    done();
                                },
                            }

                        }
                    };
                    myFunctions.userLogin(req, res);
                });
            });
        } break;
        case 'chat': {
            describe('chat', () => {
                it('it should send a message to the other user', (done) => {

                    const req = {
                        body: {
                            username: 'OneForAll5',
                            otherUsername: 'TheLastBen10',
                            messageToSend: "Hoho",
                        }
                    };

                    const res = {
                        status: (status) => {
                            return {
                                send: (responseObject) => {
                                    assert.equal(responseObject.statusMessage, "Message sent");
                                    assert.equal(status, 200);
                                    //done() is to be triggered to finish the function
                                    done();
                                },
                            }

                        }
                    };
                    myFunctions.chat(req, res);
                });
            });
        } break;
        case 'createTweet': {
            describe('createTweet', () => {
                it('it should create a new tweet', (done) => {

                    const req = {
                        body: {
                            tweetCase: 'CREATE',
                            username: 'OneForAll5',
                            newTweet: 'Hey I am Deku!',
                        }
                    };

                    const res = {
                        status: (status) => {
                            return {
                                send: (responseObject) => {
                                    assert.equal(responseObject.statusMessage, "Tweet sent");
                                    assert.equal(status, 200);
                                    //done() is to be triggered to finish the function
                                    done();
                                },
                            }

                        }
                    };
                    myFunctions.tweets(req, res);
                });
            });
        } break;
        case 'readTweet': {
            describe('readTweet', () => {
                it('it should read a tweet', (done) => {

                    const req = {
                        body: {
                            tweetCase: 'READ',
                            username: 'OneForAll5',
                            tweetID: '-MXLdinM9dqrE0HwqoD2',
                        }
                    };

                    const res = {
                        status: (status) => {
                            return {
                                send: (responseObject) => {
                                    assert.equal(responseObject.statusMessage, "Tweets retrieved");
                                    assert.equal(status, 200);
                                    //done() is to be triggered to finish the function
                                    done();
                                },
                            }

                        }
                    };
                    myFunctions.tweets(req, res);
                });
            });
        } break;
        case 'updateTweet': {
            describe('updateTweet', () => {
                it('it should update a tweet', (done) => {

                    const req = {
                        body: {
                            tweetCase: 'UPDATE',
                            username: 'OneForAll5',
                            tweetID: '-MXL_ZHh5AUKhYdB6wrw',
                            newTweet: 'This is the updated tweet',
                        }
                    };

                    const res = {
                        status: (status) => {
                            return {
                                send: (responseObject) => {
                                    assert.equal(responseObject.statusMessage, "Tweet updated");
                                    assert.equal(status, 200);
                                    //done() is to be triggered to finish the function
                                    done();
                                },
                            }

                        }
                    };
                    myFunctions.tweets(req, res);
                });
            });
        } break;
        case 'deleteTweet': {
            describe('deleteTweet', () => {
                it('it should update a tweet', (done) => {

                    const req = {
                        body: {
                            tweetCase: 'DELETE',
                            username: 'OneForAll5',
                            tweetID: '-MXM2hmGn9wO98ilXxBm',
                        }
                    };

                    const res = {
                        status: (status) => {
                            return {
                                send: (responseObject) => {
                                    assert.equal(responseObject.statusMessage, "Tweet deleted");
                                    assert.equal(status, 200);
                                    //done() is to be triggered to finish the function
                                    done();
                                },
                            }

                        }
                    };
                    myFunctions.tweets(req, res);
                });
            });
        } break;
        case 'like': {
            describe('like', () => {
                it('it should like a tweet', (done) => {

                    const req = {
                        body: {
                            username: 'OneForAll5',
                            tweeterUsername: 'OneForAll5',
                            tweetID: '-MXLdinM9dqrE0HwqoD2',
                        }
                    };

                    const res = {
                        status: (status) => {
                            return {
                                send: (responseObject) => {
                                    assert.equal(responseObject.statusMessage, "Like action completed");
                                    assert.equal(status, 200);
                                    //done() is to be triggered to finish the function
                                    done();
                                },
                            }

                        }
                    };
                    myFunctions.likes(req, res);
                });
            });
        } break;
        case 'retweet': {
            describe('retweet', () => {
                it('it should make a retweet', (done) => {

                    const req = {
                        body: {
                            username: 'TheLastBen10',
                            tweeterUsername: 'OneForAll5',
                            tweetID: '-MXLdinM9dqrE0HwqoD2',
                        }
                    };

                    const res = {
                        status: (status) => {
                            return {
                                send: (responseObject) => {
                                    assert.equal(responseObject.statusMessage, "Retweet action completed");
                                    assert.equal(status, 200);
                                    //done() is to be triggered to finish the function
                                    done();
                                },
                            }

                        }
                    };
                    myFunctions.retweet(req, res);
                });
            });
        } break;
    }
})