'use server';

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils";
import { CountryCode, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum, Products } from "plaid";
import { Languages } from "lucide-react";
import { plaidClient } from "../plaid";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";
import { revalidatePath } from "next/cache";
const {
  APPWRITE_DATABASE_ID:DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID:USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID:BANK_COLLECTION_ID,
}=process.env;
export const getUserInfo = async ({ userId }: getUserInfoProps) => {
  try {
    const { database } = await createAdminClient();
    const user = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('userId', [userId])]
    );
    if (user.documents.length > 0 && user.documents[0] !== undefined) {
      return parseStringify(user.documents[0]);
    } else {
      console.warn('No user document found or document is undefined');
      return null;
    }
  } catch (error) {
    console.error('Error in getUserInfo:', error);
    return null;
  }
};

export const signIn = async ({ email, password }:signInProps) => {
  let session;
  let userDocument;

  try {
    const { account, database } = await createAdminClient();

    // Log the attempt to create a session
    console.log('Attempting to create session for user:', email);

    session = await account.createEmailPasswordSession(email, password);

    if (!session) {
      throw new Error('Error creating session');
    }

    // Set the session cookie
    cookies().set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    // Log the attempt to get user document
    console.log('Attempting to retrieve user document for email:', email);

    // Get the user document from the database
    const userQuery = await database.listDocuments(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      [
        Query.equal('email', email),
      ]
    );

    // Log the result of the user query
    console.log('User query result:', userQuery);

    if (userQuery.documents.length === 0) {
      console.warn('No user document found for email:', email);
      return null;
    }

    userDocument = userQuery.documents[0];

    // Check if the user document is retrieved successfully
    if (!userDocument) {
      console.warn('User document is null or undefined');
      return null;
    }

    console.log('User document retrieved:', userDocument);

    return parseStringify(userDocument);
  } catch (error) {
    // Log detailed error information
    console.error('Error in signIn:', error);
    return null;
  }
};
export const signUp = async ({ password, ...userData }: SignUpParams) => {
  const { email, firstName, lastName } = userData;
      let newUserAccount;
      let dwollaCustomerUrl;
      let newUser;
  try{
    //Create a user acc with appwrite
      const { account , database } = await createAdminClient();

        newUserAccount=await account.create(
           ID.unique(), 
           email, 
           password, 
           `${firstName} ${lastName}`

           
        );

        if(!newUserAccount) throw new Error('Error creating user')
          dwollaCustomerUrl = await createDwollaCustomer({
            ...userData,
            type: 'personal'
          }); 

      if(!dwollaCustomerUrl) throw new Error ('Error creating Dwolla customer')

      const dwollaCustomerId=extractCustomerIdFromUrl(dwollaCustomerUrl);
      const newUser= await database.createDocument(
        DATABASE_ID!,
        USER_COLLECTION_ID!,
        ID.unique(),
        {
          ...userData,
          userId:newUserAccount.$id,
          dwollaCustomerId,
          dwollaCustomerUrl
        }
      )
      const session = await account.createEmailPasswordSession(email, password);
  
      cookies().set("appwrite-session", session.secret, {
         path: "/",
         httpOnly: true,
         sameSite: "strict",
         secure: true,
      });
      if (newUser) {
        return parseStringify(newUser);
      } else {
        console.warn('New user is null or undefined');
        return null;
      }
    } catch (error) {
      console.error('Error in signUp:', error);
      return null;
    }
  };

  export async function getLoggedInUser() {
    try {
      const { account } = await createSessionClient();
      const result = await account.get();
      const user = await getUserInfo({ userId: result.$id });
      if (user) {
        return parseStringify(user);
      } else {
        console.warn('Logged in user info is null or undefined');
        return null;
      }
    } catch (error) {
      console.error('Error in getLoggedInUser:', error);
      return null;
    }
  }

export const logoutAccount=async()=>{
  try{
    const {account}=await createSessionClient();
    cookies().delete('appwrite-session');

    await account.deleteSession('current');
  } catch(error){
    return null;
  }
}

export const createLinkToken=async(user:User)=>{
  try{
    const tokenParams = {
      user:{
        client_user_id: user.$id
      },
       client_name: `${user.firstName} ${user.lastName}`,
       products:['auth'] as Products[],
       language:'en',
       country_codes:['IN'] as CountryCode[],
    }

    const response=await plaidClient.linkTokenCreate(tokenParams);

    if (response.data.link_token) {
      return parseStringify({ linkToken: response.data.link_token });
    } else {
      console.warn('Link token is null or undefined');
      return null;
    }
  } catch (error) {
    console.error('Error in createLinkToken:', error);
    return null;
  }
};

export const createBankAccount = async ({
  userId,
  bankId,
  accountId,
  accessToken,
  fundingSourceUrl,
  sharableId,
}: createBankAccountProps) => {
  try {
    const { database } = await createAdminClient();
    const bankAccount = await database.createDocument(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        bankId,
        accountId,
        accessToken,
        fundingSourceUrl,
        sharableId,
      }
    );
    if (bankAccount) {
      return parseStringify(bankAccount);
    } else {
      console.warn('Created bank account is null or undefined');
      return null;
    }
  } catch (error) {
    console.error('Error in createBankAccount:', error);
    return null;
  }
};
export const exchangePublicToken = async ({
  publicToken,
  user,
}: exchangePublicTokenProps) => {
  try{
    const response=await plaidClient.itemPublicTokenExchange({
      public_token:publicToken,
    });

    const accessToken=response.data.access_token;
    const itemId=response.data.item_id;

    const accountsResponse=await plaidClient.accountsGet({
      access_token:accessToken,
    });
    const accountData= accountsResponse.data.accounts[0];
    const request: ProcessorTokenCreateRequest={
      access_token:accessToken,
      account_id:accountData.account_id,
      processor:"dwolla" as ProcessorTokenCreateRequestProcessorEnum,
    }

    const processorTokenResponse=await plaidClient.processorTokenCreate(request);
    const processorToken=processorTokenResponse.data.processor_token;

    const fundingSourceUrl=await addFundingSource({
      dwollaCustomerId: user.dwollaCustomerId,
      processorToken,
      bankName: accountData.name,
    });

    if(!fundingSourceUrl)throw Error;

    await createBankAccount({
      accessToken,
      userId:user.$id,
      bankId:itemId,
      accountId:accountData.account_id,
      fundingSourceUrl,
      sharableId:encryptId(accountData.account_id),

    });

    revalidatePath("/");

    return parseStringify({
      publicTokenExchange: "complete",
    });
  } catch (error) {
    console.error("An error occurred while exchanging token:", error);
    return null;
  }
};

export const getBanks = async ({ userId }: getBanksProps) => {
  try {
    const { database } = await createAdminClient();
    const banks = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('userId', [userId])]
    );
    if (banks.documents && banks.documents.length > 0) {
      return parseStringify(banks.documents);
    } else {
      console.warn('No bank documents found');
      return [];
    }
  } catch (error) {
    console.error('Error in getBanks:', error);
    return [];
  }
};

export const getBank = async ({ documentId }: getBankProps) => {
  try {
    const { database } = await createAdminClient();
    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('$id', [documentId])]
    );
    if (bank.documents && bank.documents.length > 0) {
      return parseStringify(bank.documents[0]);
    } else {
      console.warn('No bank document found');
      return null;
    }
  } catch (error) {
    console.error('Error in getBank:', error);
    return null;
  }
};
export const getBankByAccountId = async ({ accountId }: getBankByAccountIdProps) => {
  try {
    const { database } = await createAdminClient();
    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('accountId', [accountId])]
    );
    if (bank.total === 1 && bank.documents[0]) {
      return parseStringify(bank.documents[0]);
    } else {
      console.warn('No unique bank document found for the account ID');
      return null;
    }
  } catch (error) {
    console.error('Error in getBankByAccountId:', error);
    return null;
  }
};