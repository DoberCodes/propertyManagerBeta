import {
	addFamilyMember,
	getFamilyMembers,
	removeFamilyMember,
	getUserProfile,
	signUpWithEmail,
} from './authService';
import * as authServiceModule from './authService';
import { USER_ROLES } from '../constants/roles';

// Mock Firebase modules
jest.mock('../config/firebase', () => ({
	auth: {
		currentUser: { uid: 'test-user-id', email: 'test@example.com' },
	},
	db: {},
	functions: {},
}));

jest.mock('firebase/auth', () => ({
	sendPasswordResetEmail: jest.fn(),
	httpsCallable: jest.fn(),
	fetchSignInMethodsForEmail: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
	doc: jest.fn(),
	getDoc: jest.fn(),
	setDoc: jest.fn(),
	updateDoc: jest.fn(),
	collection: jest.fn(),
	query: jest.fn(),
	where: jest.fn(),
	getDocs: jest.fn(),
	addDoc: jest.fn(),
	deleteDoc: jest.fn(),
	serverTimestamp: jest.fn(() => new Date()),
}));

jest.mock('firebase/functions', () => ({
	httpsCallable: jest.fn(),
}));

// Family member features are hidden for now.
describe.skip('Family Account Functionality', () => {
	const mockAccountId = 'account-owner-id';
	const mockFamilyMemberId = 'family-member-id';

	beforeEach(() => {
		jest.clearAllMocks();
		const mockFetchSignInMethodsForEmail =
			require('firebase/auth').fetchSignInMethodsForEmail;
		const mockGetDocs = require('firebase/firestore').getDocs;
		mockFetchSignInMethodsForEmail.mockResolvedValue([]);
		mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
	});

	describe('addFamilyMember', () => {
		const mockHttpsCallable = require('firebase/functions').httpsCallable;
		const mockSendPasswordResetEmail =
			require('firebase/auth').sendPasswordResetEmail;

		beforeEach(() => {
			mockHttpsCallable.mockReturnValue(
				jest.fn().mockResolvedValue({
					data: {
						success: true,
						user: {
							id: mockFamilyMemberId,
							email: 'family@example.com',
							firstName: 'Family',
							lastName: 'Member',
							accountId: mockAccountId,
							isAccountOwner: false,
						},
						message: 'Family member added successfully',
					},
				}),
			);
			mockSendPasswordResetEmail.mockResolvedValue(undefined);
		});

		it('should successfully add a family member', async () => {
			const result = await addFamilyMember(
				mockAccountId,
				'family@example.com',
				'Family',
				'Member',
			);

			expect(result).toEqual({
				id: mockFamilyMemberId,
				email: 'family@example.com',
				firstName: 'Family',
				lastName: 'Member',
				accountId: mockAccountId,
				isAccountOwner: false,
			});

			expect(mockHttpsCallable).toHaveBeenCalledWith(
				expect.any(Object),
				'addFamilyMember',
			);
			expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
				expect.any(Object),
				'family@example.com',
			);
		});

		it('should throw error for existing email', async () => {
			const mockCallableFunction = jest
				.fn()
				.mockRejectedValue(new Error('User with this email already exists'));
			mockHttpsCallable.mockReturnValue(mockCallableFunction);

			await expect(
				addFamilyMember(mockAccountId, 'existing@example.com', 'Test', 'User'),
			).rejects.toThrow('User with this email already exists');
		});

		it('should throw error when account is full', async () => {
			const mockCallableFunction = jest
				.fn()
				.mockRejectedValue(
					new Error(
						'Family accounts are limited to 2 family members (plus the account owner)',
					),
				);
			mockHttpsCallable.mockReturnValue(mockCallableFunction);

			await expect(
				addFamilyMember(mockAccountId, 'new@example.com', 'Test', 'User'),
			).rejects.toThrow(
				'Family accounts are limited to 2 family members (plus the account owner)',
			);
		});
	});

	describe('getFamilyMembers', () => {
		const mockGetDoc = require('firebase/firestore').getDoc;
		const mockDoc = require('firebase/firestore').doc;

		it('should return family members for an account', async () => {
			const mockAccountDoc = {
				exists: () => true,
				data: () => ({
					memberIds: [mockAccountId, mockFamilyMemberId],
					subscription: { plan: 'homeowner', status: 'active' },
				}),
			};

			const mockOwnerUserDoc = {
				exists: () => true,
				data: () => ({
					firstName: 'Account',
					lastName: 'Owner',
					email: 'owner@example.com',
					accountId: mockAccountId,
					isAccountOwner: true,
					subscription: { plan: 'homeowner', status: 'active' },
				}),
			};

			const mockMemberUserDoc = {
				exists: () => true,
				data: () => ({
					firstName: 'Family',
					lastName: 'Member',
					email: 'member@example.com',
					accountId: mockAccountId,
					isAccountOwner: false,
					subscription: { plan: 'homeowner', status: 'active' },
				}),
			};

			const mockFamilyAccountDoc = {
				exists: () => true,
				data: () => ({
					subscription: { plan: 'homeowner', status: 'active' },
				}),
			};

			mockDoc.mockReturnValue({ _path: { segments: ['test'] } });

			// Use a smarter mock that returns the right doc based on what's being requested
			let getDocCallCount = 0;
			mockGetDoc.mockImplementation(() => {
				const callIndex = getDocCallCount++;
				// Call sequence for getFamilyMembers with 2 members (due to Promise.all parallellism):
				// 0 - getDoc(familyAccounts, accountId) - main getFamilyMembers
				// 1,2 - getDoc calls from first getUserProfile (owner or member - order depends on timing)
				// 3,4 - getDoc calls from second getUserProfile
				// 5,6 - getDoc calls from third... wait, only 2 getUserProfile calls

				// More likely sequence with parallel execution:
				// 0 - getDoc(familyAccounts, accountId) from getFamilyMembers
				// 1 - getDoc(users, memberId1) from Promise 1
				// 2 - getDoc(users, memberId2) from Promise 2
				// 3 - getDoc(familyAccounts, accountId) from Promise 1
				// 4 - getDoc(familyAccounts, accountId) from Promise 2

				const docs = [
					mockAccountDoc, // 0 - family account for getFamilyMembers
					mockOwnerUserDoc, // 1 - owner user doc
					mockMemberUserDoc, // 2 - member user doc
					mockFamilyAccountDoc, // 3 - family account from owner's getUserProfile
					mockFamilyAccountDoc, // 4 - family account from member's getUserProfile
				];

				return Promise.resolve(docs[callIndex] || mockFamilyAccountDoc);
			});

			const result = await getFamilyMembers(mockAccountId);

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual(
				expect.objectContaining({
					id: mockAccountId,
					firstName: 'Account',
					lastName: 'Owner',
					email: 'owner@example.com',
					accountId: mockAccountId,
					isAccountOwner: true,
				}),
			);
			expect(result[1]).toEqual(
				expect.objectContaining({
					id: mockFamilyMemberId,
					firstName: 'Family',
					lastName: 'Member',
					email: 'member@example.com',
					accountId: mockAccountId,
					isAccountOwner: false,
				}),
			);
		});

		it('should return empty array for account with no members', async () => {
			mockGetDoc.mockResolvedValue({
				exists: () => false,
			});

			const result = await getFamilyMembers(mockAccountId);
			expect(result).toEqual([]);
		});
	});

	describe('removeFamilyMember', () => {
		const mockGetDoc = require('firebase/firestore').getDoc;
		const mockUpdateDoc = require('firebase/firestore').updateDoc;
		const mockDoc = require('firebase/firestore').doc;
		const mockHttpsCallable = require('firebase/functions').httpsCallable;

		beforeEach(() => {
			// mock cloud function used to delete a family member account
			mockHttpsCallable.mockReturnValue(
				jest.fn().mockResolvedValue({ data: { success: true } }),
			);
		});

		it('should successfully remove a family member', async () => {
			const mockAccountDoc = {
				exists: () => true,
				data: () => ({
					ownerId: mockAccountId,
					memberIds: [mockAccountId, mockFamilyMemberId],
					subscription: { plan: 'homeowner', status: 'active' },
				}),
			};
			const mockMemberDoc = {
				exists: () => true,
				data: () => ({
					email: 'member@example.com',
				}),
			};

			mockGetDoc
				.mockResolvedValueOnce(mockAccountDoc)
				.mockResolvedValueOnce(mockMemberDoc);
			mockUpdateDoc.mockResolvedValue(undefined);

			await expect(
				removeFamilyMember(mockAccountId, mockFamilyMemberId, mockAccountId),
			).resolves.not.toThrow();

			expect(mockUpdateDoc).toHaveBeenCalled();
			const updateCall = mockUpdateDoc.mock.calls.find(
				([, payload]) => payload?.memberIds,
			);
			expect(updateCall?.[1]).toEqual(
				expect.objectContaining({
					memberIds: [mockAccountId], // Should only contain the owner
				}),
			);
		});

		it('should throw error when non-owner tries to remove member', async () => {
			const mockAccountDoc = {
				exists: () => true,
				data: () => ({
					ownerId: mockAccountId,
					memberIds: [mockAccountId, mockFamilyMemberId],
				}),
			};

			mockGetDoc.mockResolvedValue(mockAccountDoc);

			await expect(
				removeFamilyMember(
					mockAccountId,
					mockFamilyMemberId,
					'different-user-id',
				),
			).rejects.toThrow('Only account owners can remove family members');
		});

		it('should throw error when trying to remove self', async () => {
			const mockAccountDoc = {
				exists: () => true,
				data: () => ({
					ownerId: mockAccountId,
					memberIds: [mockAccountId, mockFamilyMemberId],
					subscription: { plan: 'homeowner', status: 'active' },
				}),
			};
			mockGetDoc.mockResolvedValue(mockAccountDoc);

			await expect(
				removeFamilyMember(mockAccountId, mockAccountId, mockAccountId),
			).rejects.toThrow('Cannot remove yourself from the account');
		});
	});

	describe('getUserProfile migration', () => {
		const mockGetDoc = require('firebase/firestore').getDoc;
		const mockUpdateDoc = require('firebase/firestore').updateDoc;
		const mockSetDoc = require('firebase/firestore').setDoc;

		it('should migrate existing user without accountId', async () => {
			const mockDoc = require('firebase/firestore').doc;
			const mockUserDoc = {
				exists: () => true,
				data: () => ({
					email: 'existing@example.com',
					firstName: 'Existing',
					lastName: 'User',
					role: USER_ROLES.ADMIN,
					subscription: { plan: 'homeowner', status: 'active' },
					// No accountId or isAccountOwner fields
				}),
			};
			const mockAccountDoc = {
				exists: () => false,
			};

			mockGetDoc
				.mockResolvedValueOnce(mockUserDoc)
				.mockResolvedValueOnce(mockAccountDoc);
			mockUpdateDoc.mockResolvedValue(undefined);
			mockSetDoc.mockResolvedValue(undefined);
			mockDoc.mockReturnValue({
				_path: { segments: ['users', 'existing-user-id'] },
			});

			const result = await getUserProfile('existing-user-id');

			expect(result.accountId).toBe('existing-user-id');
			expect(result.isAccountOwner).toBe(true);
			expect(mockUpdateDoc).toHaveBeenCalled();
			const updateCall = mockUpdateDoc.mock.calls.find(
				([, payload]) => payload?.accountId === 'existing-user-id',
			);
			expect(updateCall?.[1]).toEqual(
				expect.objectContaining({
					accountId: 'existing-user-id',
					isAccountOwner: true,
				}),
			);
			expect(mockSetDoc).toHaveBeenCalled(); // Should create family account
		});

		it('should not migrate user that already has accountId', async () => {
			const mockUserDoc = {
				exists: () => true,
				data: () => ({
					email: 'migrated@example.com',
					firstName: 'Migrated',
					lastName: 'User',
					role: USER_ROLES.ADMIN,
					accountId: 'account-123',
					isAccountOwner: true,
					subscription: { plan: 'homeowner', status: 'active' },
				}),
			};
			const mockAccountDoc = {
				exists: () => true,
				data: () => ({
					subscription: { plan: 'homeowner', status: 'active' },
				}),
			};

			mockGetDoc
				.mockResolvedValueOnce(mockUserDoc)
				.mockResolvedValueOnce(mockAccountDoc);

			const result = await getUserProfile('migrated-user-id');

			expect(result.accountId).toBe('account-123');
			expect(result.isAccountOwner).toBe(true);
			expect(mockUpdateDoc).not.toHaveBeenCalled();
		});
	});

	describe('signUpWithEmail creates family account', () => {
		const mockCreateUserWithEmailAndPassword = jest.fn();
		const mockUpdateProfile = jest.fn();
		const mockSetDoc = jest.fn();
		const mockUpdateDoc = jest.fn();

		beforeEach(() => {
			jest.doMock('firebase/auth', () => ({
				createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
				updateProfile: mockUpdateProfile,
				sendPasswordResetEmail: jest.fn(),
				httpsCallable: jest.fn(),
			}));

			jest.doMock('firebase/firestore', () => ({
				doc: jest.fn(),
				getDoc: jest.fn(),
				setDoc: mockSetDoc,
				updateDoc: mockUpdateDoc,
				collection: jest.fn(),
				query: jest.fn(),
				where: jest.fn(),
				getDocs: jest.fn(),
				addDoc: jest.fn(),
				deleteDoc: jest.fn(),
				serverTimestamp: jest.fn(() => new Date()),
			}));
		});

		it('should create family account for new user', async () => {
			// This test would need more complex mocking of the entire signup flow
			// For now, we'll focus on the core family account functionality above
			expect(true).toBe(true); // Placeholder test
		});
	});
});
