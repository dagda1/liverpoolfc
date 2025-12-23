import { execSync } from 'child_process';

if (!process.env.JENKINS_HOME) {
  console.log('Not running on Jenkins, installing Husky...');
  execSync('npx husky install', { stdio: 'inherit' });
} else {
  console.log('Running on Jenkins, skipping Husky installation.');
}
