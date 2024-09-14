import { makeOpenAIRequest } from "./openai";
import { startDictation, stopDictation, restartDictation } from "./dictation";
import { startCamera, stopCamera } from "./camera";
import { scaleAndStackImagesAndGetBase64 } from "./imageStacker";
import { makeGeminiRequest } from "./gemini";
import { Speech } from "./speech";

const IMAGE_STACK_SIZE = 3;

let isDictating = false;
let imageStack: HTMLImageElement[] = [];
let imageStackInterval: number | null = null;

let unsentMessages: string[] = [];
let openAiCallInTransit = false;
let newMessagesWatcherInterval: number | null = null;
let speech: Speech = new Speech();

export function getChosenLanguage() {
  // change language
  return "en-IN";
}

function getApiKey() {
  // change to openai/gemini
  return import.meta.env.VITE_GEMINI_KEY;
}

function pushNewImageOnStack() {
  const canvas = document.querySelector("canvas")! as HTMLCanvasElement;
  const base64 = canvas.toDataURL("image/jpeg");
  const image = document.createElement("img");
  image.src = base64;

  imageStack.push(image);
  if (imageStack.length > IMAGE_STACK_SIZE) {
    imageStack.shift();
  }
}

function dictationEventHandler(message?: string) {
  if (message) {
    unsentMessages.push(message);
    updatePromptOutput("User: " + message);
  }

  if (!openAiCallInTransit) {
    openAiCallInTransit = true;
    const base64 = scaleAndStackImagesAndGetBase64(imageStack);
    const textPrompt = unsentMessages.join(" ");
    unsentMessages = [];

    let aiFunction = null;
    // change to openai/gemini
    aiFunction = makeGeminiRequest;

    aiFunction(textPrompt, base64, getApiKey(), speech).then(() => {
      // after speech
      restartDictation();
      openAiCallInTransit = false;
    });
  }
}

export function updatePromptOutput(
  newMessage: string,
  dontAddNewLine?: boolean
) {
  const promptOutput = document.getElementById("promptOutput");
  if (!promptOutput) {
    return;
  }
  promptOutput.innerHTML += newMessage + (dontAddNewLine ? "" : "<br>");
  promptOutput.scrollTop = promptOutput.scrollHeight; // Auto-scroll to bottom
}

// after AI call in transit is done, if we have
// some messages in the unsent queue, we should make another openai call.
function newMessagesWatcher() {
  if (!openAiCallInTransit && unsentMessages.length > 0) {
    dictationEventHandler();
  }
}

document.addEventListener("DOMContentLoaded", async function () {

  document
    .querySelector("#startButton")!
    .addEventListener("click", function () {
      if (!isDictating && !getApiKey()) {
        alert("Please enter an API key.");
        return;
      }

      isDictating = !isDictating;

      if (isDictating) {
        startCamera();
        startDictation(getChosenLanguage(), dictationEventHandler);

        imageStackInterval = window.setInterval(() => {
          pushNewImageOnStack();
        }, 800);

        newMessagesWatcherInterval = window.setInterval(() => {
          newMessagesWatcher();
        }, 100);

        document.querySelector("#startButton")!.textContent = "Stop";
      } else {
        stopCamera();
        stopDictation();

        imageStackInterval && clearInterval(imageStackInterval);
        newMessagesWatcherInterval && clearInterval(newMessagesWatcherInterval);

        document.querySelector("#startButton")!.textContent = "Start";
      }
    });
});
