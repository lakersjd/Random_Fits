# Firebase product catalog setup

The admin product editor works as a local draft immediately. To publish changes to every visitor, enable Cloud Firestore for the `random-fits` Firebase project.

## Required: Cloud Firestore

1. Open the Firebase console and select the `random-fits` project.
2. Go to **Build → Firestore Database** and create the default database.
3. Choose a region close to the store's customers.
4. Open the **Rules** tab and replace the rules with the contents of `firestore.rules`.
5. Publish the rules.

The storefront can publicly read only `catalog/products`. Only the approved Google admin email can write it.

## Optional: direct picture uploads

Pasting a public image URL works without Firebase Storage. Direct file uploads require Cloud Storage for Firebase, which requires the Blaze plan for new default buckets.

1. Go to **Build → Storage** and create the default bucket.
2. Open the **Rules** tab and replace the rules with the contents of `storage.rules`.
3. Publish the rules.

Uploads are limited to authenticated admin users, image files, and 8 MB per file.

## Authentication domain

Under **Authentication → Settings → Authorized domains**, include:

`lakersjd.github.io`
