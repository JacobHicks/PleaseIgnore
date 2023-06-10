import express, { Express, Request, Response } from "express";
import { spawn } from "child_process";
import cors from "cors";

// Spawn llm process
const llmProcess = spawn("python ~/WizardLM-30B-Uncensored/WizardLM/src/inference_wizardlm.py --base_model=../WizardLM-30B-Uncensored", { shell: true });
llmProcess.stdout.setEncoding("utf8");
llmProcess.stdin.setDefaultEncoding("utf8");

let modelLoaded = false;
console.log("Waiting for model to load...");
llmProcess.stdout.on("data", data => {
  if (data.includes('#')) {
    console.log("Model loaded!");
    modelLoaded = true;
  }
});

const rest: Express = express();
rest.use(cors());
rest.use(express.json());

rest.post("/llm", async (req: Request, res: Response) => {
  if (modelLoaded) {
    console.log(req.body);

    const llmOutput = await new Promise((resolve) => {
      console.log("Waiting for model output...");
      llmProcess.stdout.on("data", data => {
        console.info(`Model output: ${data}`);
        try {
          const parsedOutput: { id: number, instruction: string, wizardlm: string } = JSON.parse(data);
          resolve(parsedOutput.wizardlm);
        } catch (e) {
          console.error(e);
        }
      });

      llmProcess.stderr.on("data", data => {
        console.error(`Model error: ${data}`);
      });

      llmProcess.stdin.cork();
      llmProcess.stdin.write(req.body.prompt + "\r\n");
      llmProcess.stdin.uncork();
    });

    res.json({ llmOutput });
  } else {
    res.json({ error: "Model not loaded yet." });
  }
});

rest.listen(8000);
