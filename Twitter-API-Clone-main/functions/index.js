const functions = require("firebase-functions");
const admin = require('firebase-admin');
const serviceAccount = require('./twitter-api-clone-d7804-firebase-adminsdk-osgz9-156bd4fe52.json');
const { requests } = require("sinon");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://twitter-api-clone-d7804-default-rtdb.firebaseio.com/',
});
const cors = require('cors')({ origin: true });//Use cors when dealing with browsers

/**
 * userRegistration a funtion to create a user's account. It is defined simply
 * @param {email} string The user's email.
 * @param {username} string The user's username.
 * @param {password} string The user's password.
 * @return {response} The response of the function.
*/
exports.userRegistration = functions.https.onRequest((request, response) => {
    // cors(request, response, () => {
    const { email, password, username } = request.body;//We get out parameters at the very beginning to avoid errors 
    if (email == '') {
        response.status(404).send({
            errorMessage: 'Email field cannot be left empty',
            statusMessage: 'Email field is empty',
        });
    }
    else if (!validateEmail(email)) {
        response.status(404).send({
            errorMessage: 'Email is not valid',
            statusMessage: 'Email is not valid',
        });
    }
    else if (password.length <= 5) {
        response.status(404).send({
            errorMessage: 'Password field is too short',
            statusMessage: 'Password field is too short',
        });
    }
    else if (username == '') {
        response.status(404).send({
            errorMessage: 'Username field cannot be left empty',
            statusMessage: 'Username field is empty',
        });
    }
    admin.database().ref(`listOfUsernames/${username}`).once('value', snapshot_username => {//We check if the username is already in use from the database. 
        admin.database().ref(`listOfEmails/${emailFormat(email, 'emailToString')}`).once('value', snapshot_email => {//We check if the email is already in use from the database.
            if (snapshot_username.val()) {//Username already exists
                response.status(404).send({
                    errorMessage: 'This username is already in use. Please try another one.',
                    statusMessage: 'Username is already in use',
                });
            }
            else if (snapshot_email.val()) {//Email already exists
                response.status(404).send({
                    errorMessage: 'This email is already in use. Please try another one.',
                    statusMessage: 'Email is already in use',
                });
            }
            else {
                admin.auth().createUser({//create the user
                    email: email,
                    password: password,
                    displayName: username,
                }).then((userRecord) => {
                    admin.database().ref(`listOfUsernames`).update({ [username]: userRecord.uid })//store the userid related to the username
                        .then(() => {
                            admin.database().ref(`listOfEmails`).update({ [emailFormat(email, 'emailToString')]: userRecord.uid })//store the userid related to the emails
                                .then(() => {
                                    admin.auth()
                                        .createCustomToken(userRecord.uid)
                                        .then((customToken) => {// Send token back to client to login after creating an account
                                            response.status(200).send({
                                                token: customToken,
                                                statusMessage: 'User created'
                                            });//send the signin token
                                        }).catch((error) => {
                                            response.status(404).send({
                                                errorMessage: 'Account has been created, please try logging in.',
                                                statusMessage: 'Account created then we encountered a network error',
                                            });
                                        });

                                })
                                .catch(error => {
                                    response.status(404).send({
                                        errorMessage: 'Network error, please retry',
                                        statusMessage: 'Failed to store the email into the database'
                                    })
                                })
                        }).catch(error => {
                            response.status(404).send({
                                errorMessage: error.message,
                                statusMessage: 'Network Error'
                            });//Firebase gives concise error message and it is usually due to having a used email or bad password
                        });
                })
            }
        }).catch((error) => {
            response.status(404).send({
                errorMessage: error.message,
                statusMessage: 'Network Error, could not retrieve email list'
            })
        });

    }).catch((error) => {
        response.status(404).send({
            errorMessage: error.message,
            statusMessage: 'Network Error, could not retrieve username list'
        });
    })
    //});
});


/**
 * userLogin a funtion to log into user account and return a token to client. It is defined simply
 * @param {email} string The user's email.
 * @param {username} string The user's username.
 * @param {password} string The user's password.
 * @return {response} The response of the function.
 * 
 * NOTE- Firebase does not permit comparing passwords to test for correctness on the server. This is to avoid hackers. 
 * Ideally this code would be in the client but for the sake of this interview I would write a code that sends a login token to the user.
 * 
 * For reference , the client code would look like this.
 * @example firebase.auth().signInWithEmailAndPassword(email, password)
  .then((userCredential) => {
    // Signed in
    const user = userCredential.user;
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;// Display this error message to the use 
  });
*/
exports.userLogin = functions.https.onRequest((request, response) => {
    //cors(request, response, () => {
    const { username, password } = request.body;
    if (username == '') {
        response.status(404).send({
            errorMessage: 'Email field cannot be left empty',
            statusMessage: 'Email field is empty',
        });
    }
    else if (password == '') {
        response.status(404).send({
            errorMessage: 'Password field cannot be left empty',
            statusMessage: 'Password field is empty or too short',
        });
    }
    admin.database().ref(`listOfUsernames/${username}`).once('value', snapshot => {//Since we are logging in with username, we retrieve the email linked to that username and use it to login in. NOTE, we stored this when we created the user 
        if (snapshot.val()) {//the username exists
            const uid = snapshot.val();
            admin.auth().getUser(uid)//get the user's records
                .then((userRecord) => {
                    admin.auth()
                        .createCustomToken(userRecord.uid)
                        .then((customToken) => {// Send token back to client to login
                            response.status(200).send({
                                token: customToken,
                                statusMessage: 'User logged in'
                            });//send the signin token
                        })
                        .catch((error) => {
                            response.status(404).send({
                                errorMessage: 'Account exists, please try logging in.',
                                statusMessage: 'Account exists, but network error cut us off, please retry'
                            });
                        });
                })
                .catch(() => {
                    response.status(404).send({
                        errorMessage: 'This user does not exist or has been disabled',
                        statusMessage: 'The user does not exist or has been disabled'
                    });
                })
        }
        else {
            response.status(404).send({
                errorMessage: 'This username does not exists',
                statusMessage: 'The username does not exist'
            });
        }
    }).catch((error) => {
        response.status(404).send({
            errorMessage: 'We encountered an error. Please try again.',
            statusMessage: 'Network error'
        });
    });
    //});
});

/**
 * chat a funtion to send a message to another user. It is defined simply
 * @param {username} string The user's username.
 * @param {otherUsername} string The username of the person you want to message.
 * @param {messageToSend} string The message you want to send.
 * @return {response} The response of the function.
*/
exports.chat = functions.https.onRequest((request, response) => {
    const { username, otherUsername, messageToSend } = request.body;
    const time = new Date().getTime();
    if (messageToSend.length == 0)
        response.status(404).send({
            errorMessage: 'The message cannot be empty',
            statusMessage: 'Message field is empty',
        });
    else if (username.length == 0)
        response.status(404).send({
            errorMessage: 'The username field is empty',
            statusMessage: 'The username field is empty',
        });
    else if (otherUsername.length == 0)
        response.status(404).send({
            errorMessage: 'The reciever field is empty',
            statusMessage: 'The reciever field is empty',
        });
    else
        admin.database().ref(`listOfUsernames/${username}`).once('value', snapshot_userID => {//We get the userid of the sender and the reciever
            admin.database().ref(`listOfUsernames/${otherUsername}`).once('value', snapshot_otherUserID => {

                const userID = snapshot_userID.val();
                const otherUserID = snapshot_otherUserID.val();

                if (!userID) {
                    response.status(404).send({
                        errorMessage: 'This user does not exist',
                        statusMessage: 'The user trying to send the message does not exist',
                    });
                }
                else if (!otherUserID) {
                    response.status(404).send({
                        errorMessage: 'The user you are trying to send a message to does not exist',
                        statusMessage: 'The reciever does not exist',
                    });
                }
                else {
                    admin.database().ref(`linkToRooms/${userID}/${otherUserID}`).once('value', snapshot => {//We are checking if the sender already has a thread with the reciever
                        if (snapshot.val())//a thread exists
                        {
                            const roomID = snapshot.val();
                            admin.database().ref(`rooms/${roomID}/messages`).push({
                                sender: username,
                                senderID: userID,
                                reciever: otherUsername,
                                recieverID: otherUserID,
                                message: messageToSend,
                                date: time,
                            })
                                .then(() => {
                                    response.status(200).send({//we have sent the message
                                        statusMessage: 'Message sent'
                                    });
                                })
                                .catch(error => {
                                    response.status(404).send({
                                        errorMessage: 'Network error',
                                        statusMessage: 'There was a network error when we tried to send the message',
                                    });
                                })
                        } else {//we have to make a thread
                            const roomID = admin.database().ref(`rooms`).push().key;
                            admin.database().ref(`rooms`).update({
                                [roomID]: {
                                    createdBy: username,
                                    createdAt: time,
                                    messages: {
                                        ['-0']: {//This is the first message, everything else gets pushed under it
                                            sender: username,
                                            senderID: userID,
                                            reciever: otherUsername,
                                            recieverID: otherUserID,
                                            message: messageToSend,
                                            date: time,
                                        }
                                    }
                                }
                            }).then(() => {//now store the roomid in both the sender and reciever
                                admin.database().ref(`linkToRooms/${userID}`).update({ [otherUserID]: roomID })
                                    .then(() => {
                                        admin.database().ref(`linkToRooms/${otherUserID}`).update({ [userID]: roomID })
                                            .then(() => {//we have stored it, now we are complete
                                                response.status(200).send({
                                                    statusMessage: 'Message sent'
                                                });
                                            })
                                            .catch(error => {
                                                response.status(404).send({
                                                    errorMessage: 'Network error',
                                                    statusMessage: 'There was a network error when we tried to update the roomid for the reciever',
                                                });
                                            })
                                    })
                                    .catch(error => {
                                        response.status(404).send({
                                            errorMessage: 'Network error',
                                            statusMessage: 'There was a network error when we tried to update the roomid for the sender',
                                        });
                                    });
                            }).catch(error => {
                                response.status(404).send({
                                    errorMessage: 'Network error',
                                    statusMessage: 'There was a network error when we tried to push the new room',
                                });
                            })
                        }
                    }).catch(error => {
                        response.status(404).send({
                            errorMessage: 'Network error',
                            statusMessage: 'There was a network error when we tried to check for an existing thread',
                        });
                    })
                }
            }).catch(error => {
                response.status(404).send({
                    errorMessage: 'Network error',
                    statusMessage: 'There was a network error when we tried to check for the recievers email',
                });
            })
        }).catch(error => {
            response.status(404).send({
                errorMessage: 'Network error',
                statusMessage: 'There was a network error when we tried to check for the senders email',
            });
        })

});

/**
 * chat a funtion to send a message to another user. It is defined simply
 * @param {username} string The user's username.
 * @param {tweetID} string The id of the tweet (optional). Since this is not a large scale project we are not going
 * to look into this but ideally, some sort of id must be supplied for us to easily identify tweets  
 * @param {newTweet} string The new tweet you want to send (optional).
 * @param {tweetCase} string This must be either CREATE, READ, UPDATE, DELETE.
 * @return {response} The response of the function.
*/
exports.tweets = functions.https.onRequest((request, response) => {
    const { username, tweetID, newTweet, tweetCase } = request.body;

    if (username.length == 0)
        response.status(404).send({
            errorMessage: 'The username field is empty',
            statusMessage: 'The username field is empty',
        });
    else
        admin.database().ref(`listOfUsernames/${username}`).once('value', snapshot_userID => {
            const userID = snapshot_userID.val();
            if (userID) {
                switch (tweetCase) {
                    case 'CREATE': {//parameters used- username, newTweet
                        if (newTweet.length == 0)
                            response.status(404).send({
                                errorMessage: 'Tweet cannot be empty',
                                statusMessage: 'The tweet is empty',
                            });
                        else
                            admin.database().ref(`tweetsByUser/${userID}`).push({
                                tweet: newTweet,
                                tweeter: username,
                                date: new Date().getTime(),
                                likes: 0,
                            }).then(() => {
                                response.status(200).send({
                                    statusMessage: 'Tweet sent',
                                });
                            }).catch(error => {
                                response.status(404).send({
                                    errorMessage: 'Network error, please try again ',
                                    statusMessage: 'Network error when we tried to send the tweet',
                                });
                            })
                    } break;
                    case 'READ': {//parameters used- username, tweetID
                        const ref = tweetID && tweetID.length != 0 ? `tweetsByUser/${userID}/${tweetID}` : `tweetsByUser/${userID}`;//We do this so that if the tweetID is present we get a specific tweet or else we get all tweets from the user
                        admin.database().ref(ref).once('value', snapshot => {
                            const tweetContent = snapshot.val();
                            if (tweetContent) {
                                response.status(200).send({
                                    singleTweet: tweetID && tweetID.length != 0 ? true : false,
                                    content: tweetContent,
                                    statusMessage: `${tweetID && tweetID.length != 0 ? 'Tweet' : 'Tweets'} retrieved`,
                                });
                            }
                            else
                                response.status(404).send({
                                    errorMessage: tweetID && tweetID.length != 0 ? 'This tweet does not exist' : 'This user has no tweets',
                                    statusMessage: tweetID && tweetID.length != 0 ? 'This tweet does not exist' : 'This user has no tweets',
                                });
                        }).catch(error => {
                            response.status(404).send({
                                errorMessage: 'Network error',
                                statusMessage: 'Network error when we tried searching for the tweet',
                            });
                        });


                    } break;
                    case 'UPDATE': { //parameters used- username, tweetID, newTweet
                        if (!tweetID || tweetID.length == 0)
                            response.status(404).send({
                                errorMessage: 'TweetID cannot be empty',
                                statusMessage: 'The tweetID is empty',
                            });
                        else if (!newTweet || newTweet.length == 0)
                            response.status(404).send({
                                errorMessage: 'Updated tweet cannot be empty',
                                statusMessage: 'The updated tweet is empty',
                            });
                        else
                            admin.database().ref(`tweetsByUser/${userID}/${tweetID}/date`).once('value', snapshot_date => {//this is just to check if the tweet exists, we query likes because it would cost less than a full query
                                const tweetExist = snapshot_date.val();
                                if (tweetExist) {
                                    admin.database().ref(`tweetsByUser/${userID}/${tweetID}`).update({
                                        tweet: newTweet,
                                        edited: new Date().getTime(),
                                    }).catch(error => {
                                        response.status(404).send({
                                            errorMessage: 'Network error, please retry',
                                            statusMessage: 'Network error when we tried updating the tweet',
                                        });
                                    })

                                    response.status(200).send({
                                        statusMessage: `${tweetID ? 'Tweet' : 'Tweets'} updated`,
                                    });
                                }
                                else
                                    response.status(404).send({
                                        errorMessage: 'This tweet does not exist',
                                        statusMessage: 'This tweet does not exist, the tweetID is not valid',
                                    });
                            }).catch(error => {
                                response.status(404).send({
                                    errorMessage: 'Network error',
                                    statusMessage: 'Network error when we tried to check if the tweet existed',
                                });
                            })
                    } break;
                    case 'DELETE': {
                        if (!tweetID || tweetID.length == 0)
                            response.status(404).send({
                                errorMessage: 'TweetID cannot be empty',
                                statusMessage: 'The tweetID is empty',
                            });
                        else
                            admin.database().ref(`tweetsByUser/${userID}/${tweetID}/date`).once('value', snapshot_date => {
                                const tweetExist = snapshot_date.val();
                                if (tweetExist) {
                                    admin.database().ref(`tweetsByUser/${userID}/${tweetID}`).remove()
                                        .catch(() => {
                                            response.status(404).send({
                                                errorMessage: 'Network error',
                                                statusMessage: 'Network error when we tried to delete the tweet',
                                            });
                                        })
                                    response.status(200).send({
                                        errorMessage: 'Tweet deleted',
                                        statusMessage: 'Tweet deleted',
                                    });
                                }
                                else
                                    response.status(404).send({
                                        errorMessage: 'This tweet does not exist',
                                        statusMessage: 'This tweet does not exist, the tweetID is not valid',
                                    });
                            })
                    } break;
                    default: {
                        response.status(404).send({
                            errorMessage: 'Invalid case selected',
                            statusMessage: 'Invalid case selected',
                        });
                    }
                }
            }
            else
                response.status(404).send({
                    errorMessage: 'The username does not exist',
                    statusMessage: 'This user does not exist',
                });
        }).catch(error => {
            response.status(404).send({
                errorMessage: 'Network error',
                statusMessage: 'Network error when we tried to check if the username existed',
            });
        })
});

/**
 * likes a funtion to like/unlike a tweet. You dont need to keep track of if you liked it or not.
 * Once you call the function we check if you liked the tweet or not and then we simply do the opposite.
 * @param {username} string The user's username.
 * @param {tweeterUsername} string The tweeter's username.
 * @param {tweetID} string The id of the tweet to like/unlike
 * @return {response} The response of the function.
*/
exports.likes = functions.https.onRequest((request, response) => {
    const { username, tweeterUsername, tweetID, } = request.body;
    if (username.length == 0)
        response.status(404).send({
            errorMessage: 'The username field is empty',
            statusMessage: 'The username field is empty',
        });
    else if (tweeterUsername.length == 0)
        response.status(404).send({
            errorMessage: 'The tweeters username field is empty',
            statusMessage: 'The tweeters username is  empty, we need it to find the tweet',
        });
    else if (tweetID.length == 0)
        response.status(404).send({
            errorMessage: 'The tweetID field is empty',
            statusMessage: 'The tweetID is empty, we need it to find the tweet',
        });
    else
        admin.database().ref(`listOfUsernames/${username}`).once('value', snapshot_userID => {//check if the user exists
            admin.database().ref(`listOfUsernames/${tweeterUsername}`).once('value', snapshot_tweeterID => {//check if the tweeter exists
                const tweeterID = snapshot_tweeterID.val();
                const userID = snapshot_userID.val();

                if (!userID)
                    response.status(404).send({
                        errorMessage: 'This user does not exist',
                        statusMessage: 'This user does not exist',
                    })
                else if (!tweeterID)
                    response.status(404).send({
                        errorMessage: 'This tweeter does not exist',
                        statusMessage: 'This tweeter does not exist',
                    })
                else {
                    admin.database().ref(`tweetsByUser/${tweeterID}/${tweetID}/date`).once('value', snapshot => {
                        if (snapshot.val()) {//the tweet exists, now let is check if the user has liked it before or not

                            admin.database().ref(`likesByUser/${userID}/${tweetID}`).once('value', snapshot_liked => {
                                const likedOrNot = snapshot_liked.val() ? true : false;

                                if (likedOrNot) {//has previously been liked so now we unlike it
                                    admin.database().ref(`likesByUser/${userID}/${tweetID}`).remove()
                                        .then(() => {
                                            admin.database().ref(`tweetsByUser/${tweeterID}/${tweetID}/likes`).transaction(status => {
                                                return status - 1;
                                            }, (e, committed, snap) => {
                                                if (e)
                                                    console.log('TRANSACTION FAILED ', e);
                                                else if (!committed)
                                                    console.log('TRANSACTION ABORTED');
                                            }).then(() => {
                                                response.status(200).send({ statusMessage: 'Like action completed' });
                                            }).catch(error => {
                                                response.status(404).send({
                                                    errorMessage: 'Network error',
                                                    statusMessage: 'There was a network error when we tried to like the tweet',
                                                })
                                            });
                                        })
                                        .catch(error => {
                                            response.status(404).send({
                                                errorMessage: 'Network error',
                                                statusMessage: 'There was a network error when we tried to store the unliked tweet',
                                            })
                                        })

                                } else {//has not been liked so now we like it
                                    admin.database().ref(`likesByUser/${userID}`).update({
                                        [tweetID]: tweeterUsername,
                                    })
                                        .then(() => {
                                            admin.database().ref(`tweetsByUser/${tweeterID}/${tweetID}/likes`).transaction(status => {
                                                return status + 1;
                                            }, (e, committed, snap) => {
                                                if (e)
                                                    console.log('TRANSACTION FAILED ', e);
                                                else if (!committed)
                                                    console.log('TRANSACTION ABORTED');
                                            }).then(() => {
                                                response.status(200).send({ statusMessage: 'Like action completed' });
                                            }).catch(error => {
                                                response.status(404).send({
                                                    errorMessage: 'Network error',
                                                    statusMessage: 'There was a network error when we tried to like the tweet',
                                                })
                                            });
                                        }).catch(error => {
                                            response.status(404).send({
                                                errorMessage: 'Network error',
                                                statusMessage: 'There was a network error when we tried to store the liked tweet',
                                            })
                                        })
                                }
                            }).catch((error) => {
                                response.status(404).send({
                                    errorMessage: 'Network error',
                                    statusMessage: 'There was a network error when we tried to check for the liked tweet',
                                })
                            })


                        }
                        else
                            response.status(404).send({
                                errorMessage: 'The tweet does not exist',
                                statusMessage: 'The tweet does not exist',
                            })
                    }).catch(error => {
                        response.status(404).send({
                            errorMessage: 'Network error',
                            statusMessage: 'There was a network error when we tried to check for the tweet',
                        })
                    })
                }

            }).catch(error => {
                response.status(404).send({
                    errorMessage: 'Network error',
                    statusMessage: 'Network error when we tried checking for the tweeter ID'
                })
            })
        }).catch(error => {
            response.status(404).send({
                errorMessage: 'Network error',
                statusMessage: 'Network error when we tried checking for the userID'
            })
        })
});

/**
 * likes a funtion to retweet/unretweet a tweet. You dont need to keep track of if you retweeeted it or not.
 * Once you call the function we check if you alreaded retweeted the tweet or not and then we simply do the opposite.
 * @param {username} string The user's username.
 * @param {tweeterUsername} string The tweeter's username.
 * @param {tweetID} string The id of the tweet to retweet/unretweet
 * @return {response} The response of the function.
*/
exports.retweet = functions.https.onRequest((request, response) => {
    const { username, tweeterUsername, tweetID, } = request.body;
    if (username.length == 0)
        response.status(404).send({
            errorMessage: 'The username field is empty',
            statusMessage: 'The username field is empty',
        });
    else if (tweeterUsername.length == 0)
        response.status(404).send({
            errorMessage: 'The tweeters username field is empty',
            statusMessage: 'The tweeters username is  empty, we need it to find the tweet',
        });
    else if (tweetID.length == 0)
        response.status(404).send({
            errorMessage: 'The tweetID field is empty',
            statusMessage: 'The tweetID is empty, we need it to find the tweet',
        });
    else
        admin.database().ref(`listOfUsernames/${username}`).once('value', snapshot_userID => {//check if the user exists
            admin.database().ref(`listOfUsernames/${tweeterUsername}`).once('value', snapshot_tweeterID => {//check if the tweeter exists
                const tweeterID = snapshot_tweeterID.val();
                const userID = snapshot_userID.val();

                if (!userID)
                    response.status(404).send({
                        errorMessage: 'This user does not exist',
                        statusMessage: 'This user does not exist',
                    })
                else if (!tweeterID)
                    response.status(404).send({
                        errorMessage: 'This tweeter does not exist',
                        statusMessage: 'This tweeter does not exist',
                    })
                else {
                    admin.database().ref(`tweetsByUser/${tweeterID}/${tweetID}`).once('value', snapshot => {
                        if (snapshot.val()) {//the tweet exists, now let is check if the user has retweeted
                            const fullTweet = snapshot.val();
                            admin.database().ref(`retweetsByUser/${userID}/${tweetID}`).once('value', snapshot_retweetID => {
                                const retweetID = snapshot_retweetID.val();

                                if (retweetID) {//has previously been retweeted so now we unretweet it
                                    admin.database().ref(`tweetsByUser/${userID}/${retweetID}`).remove()
                                        .then(() => {
                                            admin.database().ref(`retweetsByUser/${userID}/${tweetID}`).remove()
                                                .then(() => {
                                                    response.status(200).send({ statusMessage: 'Retweet action completed' });
                                                }).catch(error => {
                                                    response.status(404).send({
                                                        errorMessage: 'Network error',
                                                        statusMessage: 'There was a network error when we tried to make the retweet',
                                                    })
                                                });
                                        })
                                        .catch(error => {
                                            response.status(404).send({
                                                errorMessage: 'Network error',
                                                statusMessage: 'There was a network error when we tried to store the retweet',
                                            })
                                        })

                                } else {//has not been retweeted so now we retweet it
                                    const newRetweetID = admin.database().ref(`tweetsByUser/${userID}`).push().key;
                                    admin.database().ref(`retweetsByUser/${userID}`).update({//store the new retweet id
                                        [tweetID]: newRetweetID,
                                    })
                                        .then(() => {//now we push the retweet to regular tweet thread
                                            admin.database().ref(`tweetsByUser/${userID}`).update({
                                                [newRetweetID]: {
                                                    ...fullTweet,
                                                    retweet: true, 
                                                    originalTweetID: tweetID,
                                                    originalTweeter: tweeterID
                                                }
                                            }).then(() => {
                                                response.status(200).send({ statusMessage: 'Retweet action completed' });
                                            }).catch(error => {
                                                response.status(404).send({
                                                    errorMessage: 'Network error',
                                                    statusMessage: 'There was a network error when we tried to make a retweet',
                                                })
                                            });
                                        }).catch(error => {
                                            response.status(404).send({
                                                errorMessage: 'Network error',
                                                statusMessage: 'There was a network error when we tried to store the retweet',
                                            })
                                        })
                                }
                            }).catch((error) => {
                                response.status(404).send({
                                    errorMessage: 'Network error',
                                    statusMessage: 'There was a network error when we tried to check for the tweet',
                                })
                            })


                        }
                        else
                            response.status(404).send({
                                errorMessage: 'The tweet does not exist',
                                statusMessage: 'The tweet does not exist',
                            })
                    }).catch(error => {
                        response.status(404).send({
                            errorMessage: 'Network error',
                            statusMessage: 'There was a network error when we tried to check for the tweet',
                        })
                    })
                }

            }).catch(error => {
                response.status(404).send({
                    errorMessage: 'Network error',
                    statusMessage: 'Network error when we tried checking for the tweeter ID'
                })
            })
        }).catch(error => {
            response.status(404).send({
                errorMessage: 'Network error',
                statusMessage: 'Network error when we tried checking for the userID'
            })
        })
});

/**
 * emailFormat a funtion to format emails into a way that they can
 * be stored in the database. It is defined simply
 * @param {email} string The user's email.
 * @param {type} string The the way we want to store it.
 * @return {newEmail} The email after being formatted.
 */
function emailFormat(email, type) {
    //@ is stored as -(hyphen)
    //. is stored as _(underscore)
    switch (type) {
        case 'emailToString': {
            return (email.replace('@', '-').replace('.', '_'));
        } break;
        case 'stringToEmail': {
            return (email.replace('-', '@').replace('_', '.'));
        } break;
    }
};

/**
 * validateEmail a funtion test if the email is correctly formatted
 * @param {email} string The user's email.
 * @return {result} boolean if the email is correctly formatted or not.
 */
function validateEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}