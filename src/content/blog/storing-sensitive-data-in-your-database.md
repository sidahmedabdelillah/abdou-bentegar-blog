---
author: BENTEGAR Sid Ahmed Abdelillah
pubDatetime: 2023-03-12T15:22:00Z
title: How to store sensitive data in your database with demande access from user
postSlug: how-to-store-sensitive-data-in-your-database-with-demande-access-from-user
featured: true
draft: false
tags:
  - tutorials
ogImage: ""
description: In this blog post i will be talking on how to store sensitive user data in your database with on demande access from the user
---

## Table of contents

## Introduction

During the developement of my latest project i stumbled uppon a problem that seemed to me like it needed a very specific solution. The TLDR of the problem was that i needed to store some data that was specific to a user, this data needed to be encrypted in a way that makes it unaccessebile by me as a developer or by anyone on the team, on the other hand the data needed to be decrypted by the backend to be used to communicate with other services but the decryption needed to happend by demande of the user with a decryption key that only the user knows. The other important cryterial was to allow the user to change his key with minimum friction. This implementation needed to be generalised to be used across the app and not be specific to a certain data type. does that ring a bell ?

## General idea

### Encryption procedure

1. Generat encryption keys
2. Encrypt the user data
3. Recover the user secret decryption key as an input
4. Encrypt the previously generated encription keys using the user secret
5. Store the encrypted encryption keys in the database

### Decription procedure

1. Recover the user secret decyption key as input
2. Recover the encrypted encryption key from the database
3. Decrypt the encrypted encryption key using the user secret key
4. Decrypt the sensitive informations using the decrypted encryption key
5. Use the decripted data as needed.

### Changing the user secret decryption key

1. Recover the **OLD** and the **NEW** decyption secret user key as input
2. Recover the encrypted encryption key from the database
3. Decrypt the encrypted encription key using the **OLD** user secret
4. Encrypt the decripted encryption key using the **NEW** user secret
5. Store the newly encrypted encryption keys in the database for future use

## Diving deeper

### Storing the user data

![storing-the-sensitive-data](/assets/img/storing-sensitive-data-in-your-database/storing-the-sensitive-data.png)

In this the scenario the backend service will receive the user sensitive data as well as the encryption secret key as input from the user. The backend will use two diffrente encryption algorithms. The first one is based on a key derivation algorithm such as **_PBKDF2_** to encrypt the encryption keys using keys that where derived from the user secret. The second algorithm is an AES based encryption that uses an decryption/ initiation vector pair to encyprt the user data. This pair will be later encripted using the derived keys to be stored in the database in a crypted format.

### Using the user data

![using-the-user-data.](/assets/img/storing-sensitive-data-in-your-database/using-the-user-data.png)

In this scenario the backend service with receive a request from a user to certain service the requires on demande access to the user **\*sensitive** data. The user need to provide his secret as part of ther request. The service will retreive the encrypted decryption keys from the database and proceed to decrypt them using the user secret key. The final part is to retreive the encrypted data from the database and decrypt them using the fraishly decrypted encryption keys.

### Changing the user secret key

![changing-the-user-secret.](/assets/img/storing-sensitive-data-in-your-database/changing-the-user-secret.png)

The other scenario that needs to be handeled is changing the user secret key. This procedure needs to have minimum friction. The user needs to provide the **_OLD_** secret key and a **_NEW_** secret key to be set. Initially the backend retreives the encrypted encryption keys from the database and proceed to decrypt them using the **_OLD_** secret. The next step is to encypt the fraishly decrepted data and finally stores the results in the database. This method have minimum friction with all the other user's data. The previously encrypted user data will not be affected nor decrypted while changing the secret key.

## Code example

The code example bellow should be treated as pseudo code. The purpose of this code is to represente the steps that needs to be followed to achive this kind of solution and not a copy-past functionning solution.

### Storing the user data code example

```ts
// get the user data
const { userSecretData, userSecret } = req.body;

// Hash the activation key to store in database
const salt = await bcrypt.genSalt();
const hashedActivationKey = await bcrypt.hash(userSecret, salt);

// Generate securityKey and init vector for node
// informations encryption
const [Securitykey, initVector] = generateEncryptionKeyAndIv();

// Encrypt the userSecretData using the activation key
const encryptedSecretData = encryptUsingEncryptionKey(
  userSecret,
  Securitykey,
  initVector
);

// store the secretData in the database
const node = await storeEncryptedSecretData(encryptedSecretData);

const encryptedEncryptionKey = encryptUsingPassword(
  encryptedSecretData,
  userSecret
);

const encryptedIV = encryptUsingPassword(initVector, userSecret);

await storeEncryptedDecriptionKeys(encryptedEncryptionKey, encryptedIV);
```

### Using the secret user data code example

```ts
// get the encrypted secret data
const encryptedSecretData = getEncryptedSecretDataFromDatabase();

// get the encrypted encryption keys
const encryptedEncryptionKeys = await getNodeEncryptionKeys(node.id);

// get the user secret from the request body
const userSecret = req.userSecret;

const { encryption_key, init_vector } = encryptedEncryptionKeys;

// decrypt the encryption keys using the user secret
const decryptedEncryptionKey = decryptUsingPassword(encryption_key, userSecret);

const decryptedIV = decryptUsingPassword(init_vector, userSecret);

// decrypt the user data using the decrypted key pair
const decryptedUserData = decryptUsingEncryptionKey(
  encryptedSecretData,
  decryptedEncryptionKey,
  decryptedIV
);

// forward the decrypted data to the next service
next(decryptedUserData);
```

## Conclusion

While comming with the initial plan for theese procedures required some planning, the actuall implementation of this service was quiet straight forward. The solution performed the all the needed functionalities in house without needing external services or dependencies. At the end we can present the pros and cons of this kind of implementations as following

### PROS

- Security and privacy: This kind of implementation provides the maximum data security and user privacy.
- Zero dependency: This service is designed to run inhouse without depending on external key management systems, this eliminates any future vendor locks.
- Simplicity: This straight forward implementation garantees the "just works" aspect required.

### Cons

- Runtime overhead: storing the data in an encypted format requires running the decryption algorithm two times on every request, this will slow down requests. This could be avoided by implemeting some kind of a caching policy, but the caching will be a comprimise on the security and privacy aspect.
- No recovery solution: giving the user total anonimity means that he will be the only holder of the secret key without any backup or recovery solution. On an event where a user loses his secret there will be no way of decrypting the user data.
