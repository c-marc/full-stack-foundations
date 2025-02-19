import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import fsExtra from 'fs-extra'
import { $ } from 'execa'
import {
	getApps,
	isProblemApp,
	setPlayground,
} from '@kentcdodds/workshop-app/apps.server'
import { getWatcher } from '@kentcdodds/workshop-app/change-tracker'

// getApps expects this env var
process.env.NODE_ENV = 'development'

const allApps = await getApps()
const uniqueApps = allApps.filter(
	(a, index) => allApps.findIndex(b => b.fullPath === a.fullPath) === index,
)
const problemApps = allApps.filter(isProblemApp)

console.log(
	'🎭 installing playwright for testing... This may require sudo (or admin) privileges and may ask for your password.',
)
const playwrightResult = await $({
	all: true,
})`npx playwright install chromium --with-deps`
if (playwrightResult.exitCode === 0) {
	console.log('✅ playwright installed')
} else {
	console.log(playwrightResult.all)
	throw new Error('❌  playwright install failed')
}

const firstProblemApp = problemApps[0]
if (firstProblemApp) {
	console.log('🛝  setting up the first problem app...')
	const playgroundPath = path.join(process.cwd(), 'playground')
	if (await fsExtra.exists(playgroundPath)) {
		console.log('🗑  deleting existing playground app')
		await fsExtra.remove(playgroundPath)
	}
	await setPlayground(firstProblemApp.fullPath).then(
		() => {
			console.log('✅ first problem app set up')
		},
		error => {
			console.error(error)
			throw new Error('❌  first problem app setup failed')
		},
	)
}

getWatcher().close()
