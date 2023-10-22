# Twitter-API-Clone
A Twitter API clone with only backend endpoints using firebase

## Background
I used **firebase** as the backend for this server so majority of this code uses firebase to function. The code is contained in _functions/index.js_ and it has all the endpoints that I was assigned about for the backend. I did everything up until the very last portion which involved threading and this was due to insufficient time. A few important things I would like to dicsuss:
- The user login function is something I would ideally do on the client side instead of the server side. You can find the client side code commented abouve the server side code for reference. 
- For the function requiring *creating, updating, reading and deleting a tweet* I made the decision to make it into one function broken down by several switches.So in the body of the request, you put what mode you are going for ansd simply use that. Also I assumed that we would be provided a tweet identification code or some sort of id in the request body. If I was making a full scale app, there would obviously be a way for tweets to be identified and used so was a necessary assumption so that we could find all the tweets efficently.
- Likes, retweets work perfectly, and I am most proud of those parts. 
- Database queries are minimized and only made when necessary

## Testing
The test file is in _functions/test/test.index.js_. To change between different tests you can use the switch statement and change the case to test whatever function you like to test.  You can test the functions by setting the parameters in the switch case that you want to work on and then going ahead to check it out. My database rules are currently open for the sake of the assessment so please feel free to test it. Also feel free to check the authentication portion of the app. If you require access to the firebase realtime database or my authentication (current users and whatnot) , please contact me at edokoh999@gmail.com.
