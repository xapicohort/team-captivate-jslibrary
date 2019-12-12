# How to capature/create ISO durations for xAPI


This could be used for a variety of things, but this walkthrough is designed to capture the duration of focus and unfocus event as an example.  I apologize if the code is over commented, but I know we have lots of .js beginners and I used to hate when I didn't understand what or why code did what it did.

You can access a published version of this demo at

<http://www.brianfloyd.me/duration_example>


The focus/unfocus function (DOMListener) was taken more or less from this post on stack overflow-
<https://stackoverflow.com/questions/1060008is-there-a-way-to-detect-if-a-browser-window-is-not-currently-active>

```javascript
    //this grabs the time when the browser was openened newDate() is a default .js method
    let timeWhenWeFirstStartListening = new Date().getTime();
    /*this declares the unfocusTime and focusTime variables 
    Note: These are set up as global varaiable which is not good practice or how to 
    handle a production implementation*/    
    let unfocusTime;
    let focusTime;
    /*functon focus/unfocus listener it also takes a callback.  A callback is just a function passed
    into another function and runs when called.  In this case when the focus or unfoucus event fires
    the callback executes.  This callback is defined in the next DOMListener function call below
    the convertToISO helper functoin defintion*/
    const DOMListener = (callback)=>{
    $('.start-time').text(timeWhenWeFirstStartListening);
    let visible = true;
    if (!callback) {
        throw new Error('no callback given');
    }
    function focused() {
        if (!visible) {
            callback(visible = true);
        }
    }
    function unfocused() {
        if (visible) {
            callback(visible = false);
        }
    }
    // Standards:
    if ('hidden' in document) {
        document.addEventListener('visibilitychange',
            function() {(document.hidden ? unfocused : focused)()});
    }
    if ('mozHidden' in document) {
        document.addEventListener('mozvisibilitychange',
            function() {(document.mozHidden ? unfocused : focused)()});
    }
    if ('webkitHidden' in document) {
        document.addEventListener('webkitvisibilitychange',
            function() {(document.webkitHidden ? unfocused : focused)()});
    }
    if ('msHidden' in document) {
        document.addEventListener('msvisibilitychange',
            function() {(document.msHidden ? unfocused : focused)()});
    }
    // I deleted the last condition for IE9, cuz well IE9 :^)
   // All others:
    window.onpageshow = window.onfocus = focused;
    window.onpagehide = window.onblur = unfocused; 
}
//helper function to convert milliseconds to ISO
convertMilliSecondsToISO = (millis)=>{
        if(isNaN(millis))return undefined
        let minutes = Math.floor(millis / 60000);
        let seconds = ((millis % 60000) / 1000).toFixed(0);
        return `PT0H${minutes}M${Number(seconds) < 10 ? '0' : ''}${seconds}S`;
    };
/*this calls the DOMListner to listen for focus/unfocus event and provides everything passed the 
first ( is the callback function....focus is passed into the callback and is the visible= value
from our event listener*/
DOMListener(focus=>{
        /*When the listener above fires (user focuses or unfocuses) it changees the state of focus so 
        this if/else statement will listen for that !focus means the value of focus evaluates false*/
        if(!focus){
            /*The first time we unfocus we don't have a focusTime yet this is why we needed a start 
            time, but we only want to use the project start time for focus the first instance of unfocus so 
            this if statement sets the unfocusTime to timeWhenWeFirstStartListening using truthy 
            falsy - if declared variable is undefined do this else if it has a value do that*/
            if(!focusTime) {focusTime = timeWhenWeFirstStartListening}
            //we need to get the time a time on unfocus
            unfocusTime = new Date().getTime();
            //Dom output
            $('.unfocus').text(unfocusTime);
            /*Now we just need to get the difference timeWhenWeFirstStartListening/focusTime to unfocusTime
             Math.abs() is a method that turns negative integer into a positive integer 
             (absolute value of a number) .  For instace if you start at 12:00 and unfocused 
             at 12:03 the deficit would be -3 minutes but have and absoulute time of 3 total minutes*/
            let milliseconds = Math.abs((focusTime - unfocusTime));
            //Dom output
            $('.delta').text(milliseconds)
            /*finally we are going to use the call the helper function beloew to convert our 
            milliseconds into the ISO standard that result.definition*/
            let convertedTime = convertMilliSecondsToISO(milliseconds);
            //Dom output
            $('.final-unfocus').text(convertedTime);
        } 
        /*now we need to do similar thning for when we refocus the else statement is saying this is 
         what happens when it is not false or more simply when foucus is true*/
        else{
            /*becuase we can never focus without first losing focus we will always have a unfocusTime
            but we need to get the current that the focus(refocus) event happened*/
            focusTime = new Date().getTime();
            //Dom output
            $('.focus').text(focusTime);
            //A little more usage now of our maths
            let milliseconds = Math.abs((unfocusTime - focusTime));
            //Dom output
            $('.delta').text(milliseconds)
            // conveft millis to ISO
            let convertedTime = convertMilliSecondsToISO(milliseconds);
            //Dom output
            $('.final-focus').text(convertedTime);
        }
});
```
