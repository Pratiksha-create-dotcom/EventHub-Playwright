
//Import defineConfig from @playwright/test
import { defineConfig ,devices} from "@playwright/test";



export default defineConfig({
//Configure testDir
testDir: './tests',
//Configure baseURL with BASE_URL
use: {
       baseURL: "https://eventhub.rahulshettyacademy.com",
    },

//Configure retries with a simple value such as 0 or 1
//retries:1,

 

     // Configure at least two browser projects: chromium and firefox
  projects:[ 

       { name: 'chromium',
use:{
           ...devices["Desktop Chrome"]
        }
},
        
//**{ name: 'firefox',
//use:{
         
        
      
    //  ...devices["Desktop Firefox"]

      
       

    //},},
   ],
});