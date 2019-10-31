Q: Can the same index.html page be used when republishing.

A: Yes, the same index page can be used even from project to project, the only consideration we are
   aware of is if the size of the project (resolution or responsive) changes you will likely need a new index page.


Q: How does superwrapper establish user

A: First it looks for an LMS and Scorm package and pulls user if avaiable
  
   Next, it looks for a passed 'mailto' param you can append email if you have link for course by adding 
  
  ```?mailto=sample@replaceme.com```

   Finally, if the first 2 conditions are null superwrapper will prompt user to enter email address


