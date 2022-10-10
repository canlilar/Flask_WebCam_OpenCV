//import all dependencies
//Usually, we put a list of what to import in curly braces import {...}, like this:
// import {sayHi, sayBye} from './say.js'; 
// But if there’s a lot to import, we can import everything as an object using import * as <obj>, for instance:
// import * as say from './say.js'; 
// say.sayHi('John');

import * as teachablemachine from "./teachable-machine" 
import * as mediapipe from "./media-pipe" 

mediapipe.camera.start();