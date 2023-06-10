import express, { Express, Request, Response } from 'express';
import { spawn } from "child_process";
import cors from 'cors';

// Spawn llm process
const llmProcess = spawn('python ~/WizardLM-30B-Uncensored/WizardLM/src/inference_wizardlm.py --base_model=~/WizardLM-30B-Uncensored', {shell: true})
llmProcess.stdout.setEncoding('utf-8');
llmProcess.stdin.setDefaultEncoding('utf-8');

const rest: Express = express();
rest.use(cors());
rest.use(express.json());

rest.post('/llm', async (req: Request, res: Response) => {
  console.log(req.body);
  llmProcess.stdin.cork();
  llmProcess.stdin.write(req.body.prompt + '\r\n');
  llmProcess.stdin.uncork();

  const llmOutput = await new Promise((resolve, reject) => {
    llmProcess.stdout.on('data', data => {
      console.info(`Model output: ${data}`);
      try {
        const parsedOutput: { id: number, instruction: string, wizardlm: string } = JSON.parse(data);
        resolve(parsedOutput.wizardlm);
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
  });

  res.json({llmOutput});
})

rest.listen(8000);
