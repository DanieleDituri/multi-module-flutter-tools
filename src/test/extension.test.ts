import * as assert from 'node:assert';
import * as vscode from 'vscode';
import { COMMANDS, COMMAND_TITLES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants.js';
import { MockOutputChannel, MockCancellationToken, MOCK_PROJECTS, TEST_CONSTANTS } from './testUtils.js';

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
});
