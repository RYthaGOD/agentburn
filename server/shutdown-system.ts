/**
 * Emergency system shutdown - stops all schedulers and API calls
 */

import { stopAllAIBotSchedulers } from './ai-bot-scheduler';

console.log('\n🛑 SHUTTING DOWN ENTIRE SYSTEM...\n');

// Stop all AI bot schedulers
stopAllAIBotSchedulers();

console.log('\n✅ SYSTEM SHUTDOWN COMPLETE - All schedulers stopped\n');
console.log('No more API calls will be made.\n');

process.exit(0);
