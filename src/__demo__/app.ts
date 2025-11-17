import { Kernox } from "../Kernox.js";
import { KernoAddon } from "../addon/KernoxAddon.js";

// Recommended setup structure:

import { prototypes  }   from "./setup/prototypes.js";
import { systems     }   from "./setup/systems.js";
import { collections }   from "./setup/collections.js";

// Resource bundler (Addon)

const demoApp : KernoAddon = {
    name : "demoApp",
    prototypes,
    systems,
    collections
};

// Instantiate Kernox, setup addons, and run

const app = new Kernox();

app.use(demoApp);

// Define scenes
const scenes = ["scene1", "scene2", "scene3"];
let currentSceneIndex = 0;

// Create circles in different scenes
scenes.forEach((sceneName, sceneIndex) => {
    // Switch to the scene
    app.collectionManager.switchScene(sceneName);
    
    // Create circles with different colors for each scene
    const colors = ["rgb(255,100,100)", "rgb(100,255,100)", "rgb(100,100,255)"];
    
    for(let i = 0; i < 20; i++){
        app.entityFactory.create("demoApp.Circle", {
            position : { 
                x : 0 + Math.random() * 1000, 
                y : 0 + Math.random() * 500 
            },
            velocity : {
                x : -2.5 + Math.random() * 5, 
                y : -2.5 + Math.random() * 5 
            },
            radius : 10 + Math.random() * 20,
            color : colors[sceneIndex]
        });    
    }
});

// Start with scene1
app.collectionManager.switchScene("scene1");

// Setup scene switching UI
function setupSceneSwitching() {
    const controlsDiv = document.createElement("div");
    controlsDiv.style.cssText = "margin: 20px auto; text-align: center; max-width: 1000px;";
    
    const title = document.createElement("h2");
    title.textContent = "Scene Management Demo";
    title.style.cssText = "margin-bottom: 10px;";
    controlsDiv.appendChild(title);
    
    const sceneInfo = document.createElement("p");
    sceneInfo.id = "sceneInfo";
    sceneInfo.style.cssText = "font-size: 18px; margin: 10px 0;";
    updateSceneInfo();
    controlsDiv.appendChild(sceneInfo);
    
    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = "margin: 20px 0;";
    
    scenes.forEach((sceneName, index) => {
        const button = document.createElement("button");
        button.textContent = `Switch to ${sceneName}`;
        button.style.cssText = `
            padding: 10px 20px;
            margin: 5px;
            font-size: 16px;
            cursor: pointer;
            background-color: ${index === currentSceneIndex ? '#4CAF50' : '#2196F3'};
            color: white;
            border: none;
            border-radius: 4px;
        `;
        
        button.addEventListener("click", () => {
            currentSceneIndex = index;
            app.collectionManager.switchScene(sceneName);
            updateSceneInfo();
            updateButtons();
        });
        
        buttonContainer.appendChild(button);
    });
    
    controlsDiv.appendChild(buttonContainer);
    
    // Insert before canvas
    const canvas = document.querySelector("canvas");
    if (canvas && canvas.parentNode) {
        canvas.parentNode.insertBefore(controlsDiv, canvas);
    }
    
    function updateSceneInfo() {
        const activeScene = app.collectionManager.getActiveScene();
        const renderables = app.collectionManager.get<any>("demoApp.Renderables");
        const count = renderables.size ? renderables.size() : 0;
        sceneInfo.textContent = `Active Scene: ${activeScene} | Circles: ${count}`;
    }
    
    function updateButtons() {
        const buttons = buttonContainer.querySelectorAll("button");
        buttons.forEach((button, index) => {
            button.style.backgroundColor = index === currentSceneIndex ? '#4CAF50' : '#2196F3';
        });
    }
    
    // Update scene info every second
    setInterval(updateSceneInfo, 1000);
}

// Wait for DOM to be ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupSceneSwitching);
} else {
    setupSceneSwitching();
}

console.log(app);

app.execute();
