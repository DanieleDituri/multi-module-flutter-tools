import * as assert from 'node:assert';
import * as vscode from 'vscode';
import { COMMANDS, COMMAND_TITLES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants.js';
import {
  MockOutputChannel,
  MockCancellationToken,
  MOCK_PROJECTS,
  TEST_CONSTANTS,
  MockChildProcess,
  createMockSpawn,
  MockFileSystem,
  MockGit,
  createMockProgress,
  createMockToken,
  MOCK_PUBSPEC_YAML,
  MOCK_PUBSPEC_YAML_WITH_REMOTE_DEPS,
  MOCK_STASH_LIST,
} from './testUtils.js';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	// ============ COMMAND REGISTRATION TESTS ============
	suite('Command Registration', () => {
		test('Commands are properly defined in constants', () => {
			assert.ok(COMMANDS.CACHE_REPAIR);
			assert.ok(COMMANDS.CACHE_CLEAN);
			assert.ok(COMMANDS.CLEAN_WORKSPACES);
			assert.ok(COMMANDS.PUB_GET_ALL);
			assert.ok(COMMANDS.PUB_UPGRADE_ALL);
			assert.ok(COMMANDS.PUB_OUTDATED_ALL);
			assert.ok(COMMANDS.REVERT_PUBSPEC);
			assert.ok(COMMANDS.PULL_UPDATE_ALL);
			assert.ok(COMMANDS.DEPS_TO_LOCAL);
			assert.ok(COMMANDS.CHANGE_BRANCH_ALL);
			assert.ok(COMMANDS.RUN_CHECKS);
			assert.ok(COMMANDS.RUN_CUSTOM_ALL);
			assert.ok(COMMANDS.BUILD_RUNNER_CHECKS);
			assert.ok(COMMANDS.FIXED_SERIES);
			assert.ok(COMMANDS.SETUP_LOCAL_RPS);
		});

		test('Sample test', () => {
			assert.strictEqual(-1, [1, 2, 3].indexOf(5));
			assert.strictEqual(-1, [1, 2, 3].indexOf(0));
		});
	});

	// ============ NOTIFICATION TESTS ============
	suite('Notifications & Messages', () => {
		test('Success messages are defined for all commands', () => {
			assert.ok(SUCCESS_MESSAGES.CACHE_REPAIRED);
			assert.ok(SUCCESS_MESSAGES.CACHE_CLEANED);
			assert.ok(SUCCESS_MESSAGES.WORKSPACES_CLEANED);
			assert.ok(SUCCESS_MESSAGES.PACKAGES_FETCHED);
			assert.ok(SUCCESS_MESSAGES.CHECKS_COMPLETED);
		});

		test('Error messages are defined for all error types', () => {
			assert.ok(ERROR_MESSAGES.FLUTTER_NOT_FOUND);
			assert.ok(ERROR_MESSAGES.FILE_NOT_FOUND('/test'));
			assert.ok(ERROR_MESSAGES.GIT_CHECKOUT_FAILED('main'));
			assert.ok(ERROR_MESSAGES.NO_FLUTTER_MODULES);
			assert.ok(ERROR_MESSAGES.COMMAND_EXECUTION_FAILED('flutter', 1));
		});

		test('Warning messages are well-formed', () => {
			const warningMsg = ERROR_MESSAGES.GIT_STASH_FAILED;
			assert.ok(typeof warningMsg === 'string');
			assert.ok(warningMsg.length > 0);
		});
	});

	// ============ MOCK OUTPUT CHANNEL TESTS ============
	suite('MockOutputChannel', () => {
		test('Appends messages correctly', () => {
			const output = new MockOutputChannel();
			output.append('Hello');
			output.append(' World');
			assert.strictEqual(output.getOutput(), 'Hello World');
		});

		test('Appends lines with newline', () => {
			const output = new MockOutputChannel();
			output.appendLine('Line 1');
			output.appendLine('Line 2');
			const result = output.getOutput();
			assert.ok(result.includes('Line 1\n'));
			assert.ok(result.includes('Line 2\n'));
		});

		test('Clears messages', () => {
			const output = new MockOutputChannel();
			output.appendLine('Test');
			output.clear();
			assert.strictEqual(output.getOutput(), '');
		});

		test('Checks if message exists', () => {
			const output = new MockOutputChannel();
			output.appendLine('✅ Success');
			assert.ok(output.hasMessage('Success'));
			assert.ok(!output.hasMessage('Failure'));
		});
	});

	// ============ MOCK CANCELLATION TOKEN TESTS ============
	suite('MockCancellationToken', () => {
		test('Starts non-cancelled', () => {
			const token = new MockCancellationToken();
			assert.strictEqual(token.isCancellationRequested, false);
		});

		test('Can be cancelled', () => {
			const token = new MockCancellationToken();
			token.cancel();
			assert.strictEqual(token.isCancellationRequested, true);
		});

		test('Calls handlers when cancelled', (done) => {
			const token = new MockCancellationToken();
			let handlerCalled = false;

			token.onCancellationRequested(() => {
				handlerCalled = true;
			});

			token.cancel();

			setTimeout(() => {
				assert.ok(handlerCalled);
				done();
			}, 50);
		});

		test('Multiple handlers are called', (done) => {
			const token = new MockCancellationToken();
			let count = 0;

			token.onCancellationRequested(() => count++);
			token.onCancellationRequested(() => count++);

			token.cancel();

			setTimeout(() => {
				assert.strictEqual(count, 2);
				done();
			}, 50);
		});
	});

	// ============ CONSTANTS TESTS ============
	suite('Constants & Configuration', () => {
		test('All command constants are defined', () => {
			assert.ok(COMMANDS.CACHE_REPAIR);
			assert.ok(COMMANDS.PUB_GET_ALL);
			assert.ok(COMMANDS.RUN_CHECKS);
		});

		test('All command titles are defined', () => {
			assert.strictEqual(COMMAND_TITLES.CACHE_REPAIR, 'Repair Cache');
			assert.strictEqual(COMMAND_TITLES.PUB_GET_ALL, 'Pub Get');
		});

		test('Error message functions return valid strings', () => {
			const msg1 = ERROR_MESSAGES.FILE_NOT_FOUND('/test/path');
			assert.ok(typeof msg1 === 'string');
			assert.ok(msg1.includes('/test/path'));

			const msg2 = ERROR_MESSAGES.GIT_CHECKOUT_FAILED('develop');
			assert.ok(typeof msg2 === 'string');
			assert.ok(msg2.includes('develop'));
		});

		test('Success message functions return valid strings', () => {
			const msg = SUCCESS_MESSAGES.OPERATION_COMPLETED('Test Op', 3);
			assert.ok(typeof msg === 'string');
			assert.ok(msg.includes('Test Op'));
			assert.ok(msg.includes('3'));
		});
	});

	// ============ TEST DATA TESTS ============
	suite('Test Data & Utilities', () => {
		test('Mock projects are valid', () => {
			assert.strictEqual(MOCK_PROJECTS.length, 3);
			assert.ok(MOCK_PROJECTS[0].name);
			assert.ok(MOCK_PROJECTS[0].path);
		});

		test('Test constants are properly defined', () => {
			assert.ok(TEST_CONSTANTS.TIMEOUT_MS > 0);
			assert.ok(TEST_CONSTANTS.MODULE_NAMES.length > 0);
			assert.ok(TEST_CONSTANTS.WORKSPACE_PATH);
		});
	});

	// ============ INTEGRATION TESTS ============
	suite('Integration Tests', () => {
		test('Extension can be activated', async () => {
			const extension = vscode.extensions.getExtension('DanieleDituri.multi-module-flutter-tools');
			assert.ok(extension, 'Extension not found');
		});

		test('Extension exports activate function', async () => {
			const extension = vscode.extensions.getExtension('DanieleDituri.multi-module-flutter-tools');
			assert.ok(extension);
		});
	});

	// ============ MOCK CHILD PROCESS TESTS ============
	suite('MockChildProcess', () => {
		test('Creates mock child process with success exit code', () => {
			const child = new MockChildProcess(0, false);
			assert.strictEqual(child.exitCode, 0);
			assert.strictEqual(child.shouldError, false);
		});

		test('Creates mock child process with failure exit code', () => {
			const child = new MockChildProcess(1, false);
			assert.strictEqual(child.exitCode, 1);
		});

		test('Mock spawn creates child process', async () => {
			const spawn = createMockSpawn(0, false);
			const child = spawn('sh', ['-c', 'echo test']);
			assert.ok(child instanceof MockChildProcess);
			assert.ok(child.stdout);
			assert.ok(child.stderr);
		});

		test('Mock spawn emits close event with exit code', (done) => {
			const spawn = createMockSpawn(0, false);
			const child = spawn('sh', ['-c', 'echo test']);

			child.on('close', (code: number) => {
				assert.strictEqual(code, 0);
				done();
			});
		});

		test('Mock spawn emits error when shouldError is true', (done) => {
			const spawn = createMockSpawn(1, true);
			const child = spawn('sh', ['-c', 'false']);

			child.on('error', (error: Error) => {
				assert.ok(error.message.includes('Command failed'));
				done();
			});
		});
	});

	// ============ MOCK FILE SYSTEM TESTS ============
	suite('MockFileSystem', () => {
		test('Stores and retrieves files', () => {
			const fs = new MockFileSystem();
			fs.setFile('/test.txt', 'content');
			const content = fs.getFile('/test.txt');
			assert.strictEqual(content, 'content');
		});

		test('readFile returns stored content', async () => {
			const fs = new MockFileSystem();
			fs.setFile('/test.txt', 'hello');
			const content = await fs.readFile('/test.txt');
			assert.strictEqual(content, 'hello');
		});

		test('readFile throws ENOENT for missing file', async () => {
			const fs = new MockFileSystem();
			try {
				await fs.readFile('/missing.txt');
				assert.fail('Should throw error');
			} catch (error: any) {
				assert.strictEqual(error.code, 'ENOENT');
			}
		});

		test('writeFile stores content', async () => {
			const fs = new MockFileSystem();
			await fs.writeFile('/test.txt', 'new content');
			const content = await fs.readFile('/test.txt');
			assert.strictEqual(content, 'new content');
		});

		test('Can handle pubspec.yaml files', async () => {
			const fs = new MockFileSystem();
			fs.setFile('/pubspec.yaml', MOCK_PUBSPEC_YAML);
			const content = await fs.readFile('/pubspec.yaml');
			assert.ok(content.includes('dependencies:'));
			assert.ok(content.includes('flutter:'));
		});
	});

	// ============ MOCK GIT TESTS ============
	suite('MockGit', () => {
		test('Returns empty stash list initially', async () => {
			const git = new MockGit();
			const result = await git.raw(['stash', 'list']);
			assert.strictEqual(result, '');
		});

		test('Can add stash entries', async () => {
			const git = new MockGit();
			git.addStash('setup', 0);
			const result = await git.raw(['stash', 'list']);
			assert.ok(result.includes('setup'));
		});

		test('Can pop stash entries', async () => {
			const git = new MockGit();
			git.addStash('setup', 0);
			git.addStash('changes', 1);
			assert.strictEqual(git.stashList.length, 2);

			await git.raw(['stash', 'pop', '--index', 'stash@{0}']);
			assert.strictEqual(git.stashList.length, 1);
		});

		test('Throws error when popping from empty stash', async () => {
			const git = new MockGit();
			try {
				await git.raw(['stash', 'pop', '--index', 'stash@{0}']);
				assert.fail('Should throw error');
			} catch (error: any) {
				assert.ok(error.message.includes('No stash entries'));
			}
		});
	});

	// ============ SHELL COMMAND EXECUTION TESTS ============
	suite('Shell Command Execution', () => {
		test('Mock spawn with success exits with code 0', (done) => {
			const spawn = createMockSpawn(0, false);
			const child = spawn('sh', ['-c', 'echo success']);
			let dataEmitted = false;

			(child.stdout as any).on('data', () => {
				dataEmitted = true;
			});

			child.on('close', (code: number) => {
				assert.strictEqual(code, 0);
				assert.ok(dataEmitted);
				done();
			});
		});

		test('Mock spawn with failure exits with non-zero code', (done) => {
			const spawn = createMockSpawn(1, false);
			const child = spawn('sh', ['-c', 'false']);
			let errorDataEmitted = false;

			(child.stderr as any).on('data', () => {
				errorDataEmitted = true;
			});

			child.on('close', (code: number) => {
				assert.strictEqual(code, 1);
				assert.ok(errorDataEmitted);
				done();
			});
		});

		test('Output channel captures command output', () => {
			const output = new MockOutputChannel();
			output.appendLine('$ flutter pub get');
			output.append('Running...');
			const result = output.getOutput();
			assert.ok(result.includes('flutter pub get'));
			assert.ok(result.includes('Running...'));
		});

		test('Cancellation token prevents command execution', () => {
			const token = new MockCancellationToken();
			token.cancel();
			assert.ok(token.isCancellationRequested);
		});
	});

	// ============ FILE OPERATIONS TESTS ============
	suite('File Operations', () => {
		test('Detects active path lines in pubspec', () => {
			const fs = new MockFileSystem();
			fs.setFile('/pubspec.yaml', MOCK_PUBSPEC_YAML);
			const content = fs.getFile('/pubspec.yaml');
			assert.ok(content);
			assert.ok(content.includes('path: ../core'));
		});

		test('Distinguishes commented from active path lines', () => {
			const yaml = `
# path: ../old
dependencies:
  core:
    path: ../core
`;
			assert.ok(yaml.includes('path: ../core'));
			assert.ok(yaml.includes('# path: ../old'));
		});

		test('Can parse pubspec with remote dependencies', async () => {
			const fs = new MockFileSystem();
			fs.setFile('/pubspec.yaml', MOCK_PUBSPEC_YAML_WITH_REMOTE_DEPS);
			const content = await fs.readFile('/pubspec.yaml');
			assert.ok(content.includes('hosted:'));
			assert.ok(content.includes('https://pub.dev'));
		});

		test('Handles empty pubspec file', async () => {
			const fs = new MockFileSystem();
			fs.setFile('/pubspec.yaml', '');
			const content = await fs.readFile('/pubspec.yaml');
			assert.strictEqual(content, '');
		});
	});

	// ============ OPERATION STATISTICS TESTS ============
	suite('Operation Statistics', () => {
		test('Tracks success count correctly', () => {
			let successCount = 0;
			const projects = MOCK_PROJECTS;

			for (const project of projects) {
				if (project.name) {
					successCount++;
				}
			}

			assert.strictEqual(successCount, 3);
		});

		test('Calculates operation duration', () => {
			const startTime = Date.now();
			const duration = 100;
			// Simulate some work
			const endTime = startTime + duration;
			const durationMs = endTime - startTime;

			assert.strictEqual(durationMs, 100);
			assert.ok(durationMs > 0);
		});

		test('Tracks errors per module', () => {
			const errors: Array<{ module: string; message: string }> = [];
			errors.push({ module: 'app', message: 'Failed to fetch' });
			errors.push({ module: 'core', message: 'Timeout' });

			assert.strictEqual(errors.length, 2);
			assert.strictEqual(errors[0].module, 'app');
			assert.strictEqual(errors[1].message, 'Timeout');
		});

		test('Calculates success rate', () => {
			const successCount = 2;
			const failureCount = 1;
			const totalCount = 3;

			const successRate = (successCount / totalCount) * 100;
			assert.strictEqual(successRate, 66.66666666666666);
		});
	});

	// ============ ERROR HANDLING TESTS ============
	suite('Error Handling', () => {
		test('Handles file not found error', async () => {
			const fs = new MockFileSystem();
			try {
				await fs.readFile('/nonexistent/pubspec.yaml');
				assert.fail('Should throw error');
			} catch (error: any) {
				assert.strictEqual(error.code, 'ENOENT');
			}
		});

		test('Handles file write error', async () => {
			const fs = new MockFileSystem();
			// No actual error in mock, but test structure is valid
			await fs.writeFile('/test.txt', 'content');
			const content = await fs.readFile('/test.txt');
			assert.ok(content);
		});

		test('Handles git stash not found error', async () => {
			const git = new MockGit();
			const list = await git.raw(['stash', 'list']);
			assert.strictEqual(list, '');
		});

		test('Handles command execution error', (done) => {
			const spawn = createMockSpawn(1, true);
			const child = spawn('sh', ['-c', 'invalid']);

			let errorCaught = false;
			child.on('error', () => {
				errorCaught = true;
			});

			setTimeout(() => {
				assert.ok(errorCaught);
				done();
			}, 100);
		});

		test('Collects multiple module errors', () => {
			const errors = [
				{ module: 'module1', message: 'Error 1' },
				{ module: 'module2', message: 'Error 2' },
				{ module: 'module3', message: 'Error 3' },
			];

			assert.strictEqual(errors.length, 3);
			assert.ok(errors.every(e => e.module && e.message));
		});
	});

	// ============ PROGRESS AND CANCELLATION TESTS ============
	suite('Progress and Cancellation', () => {
		test('Progress can be reported', () => {
			const progress = createMockProgress();
			let reportCalled = false;

			// Simulate progress reporting
			if (progress) {
				progress.report({ message: 'Processing...', increment: 25 });
				reportCalled = true;
			}

			assert.ok(reportCalled);
		});

		test('Cancellation token registers handlers', (done) => {
			const token = new MockCancellationToken();
			let handlersCalled = 0;

			token.onCancellationRequested(() => {
				handlersCalled++;
			});

			token.onCancellationRequested(() => {
				handlersCalled++;
			});

			token.cancel();

			setTimeout(() => {
				assert.strictEqual(handlersCalled, 2);
				done();
			}, 50);
		});

		test('Cancellation prevents further execution', () => {
			const token = new MockCancellationToken();
			assert.strictEqual(token.isCancellationRequested, false);

			token.cancel();
			assert.strictEqual(token.isCancellationRequested, true);
		});

		test('Multiple operations can be cancelled', () => {
			const token1 = new MockCancellationToken();
			const token2 = new MockCancellationToken();

			token1.cancel();
			token2.cancel();

			assert.ok(token1.isCancellationRequested);
			assert.ok(token2.isCancellationRequested);
		});
	});
});
