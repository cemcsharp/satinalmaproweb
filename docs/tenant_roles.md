# Tenant Roles Documentation

The `Tenant` model in SatinalmaPRO serves as the primary organizational entity, supporting a dual-role architecture that allows a single tenant to act as both a **Buyer** and a **Supplier**.

## Role Flags

The `Tenant` model uses two boolean flags to determine its functional capabilities:

- `isBuyer`: Default is `true`. Enables procurement-related features such as creating `Request`s, `Order`s, and `Rfq`s.
- `isSupplier`: Default is `false`. Enables sales-related features such as receiving `Rfq` invitations, submitting `Offer`s, and managing `Product` catalogs.

### Why Daul Roles?

Unlike traditional systems that strictly separate buyers and suppliers into different tables, SatinalmaPRO's unified model supports complex business scenarios:

1.  **Circular Supply Chains**: A company might sell raw materials to a manufacturer (Supplier role) while simultaneously purchasing finished goods from them (Buyer role).
2.  **Internal Procurement**: Large holdings can manage internal trade between subsidiaries within the same platform.
3.  **Marketplace Participants**: Small businesses often act as both consumers and producers.

## Functional Implications

### When `isBuyer` is true:
- Can create and manage Departments and Budgets.
- Can initiate procurement Requests.
- Can create RFQs and invite Suppliers.
- Can issue Orders and track Deliveries.
- Access to the main dashboard and procurement modules.

### When `isSupplier` is true:
- Appears in the "Suppliers" list for Buyers.
- Can be invited to RFQs.
- Access to the **Supplier Portal**.
- Can maintain a Product Catalog.
- Can submit Offers and track Order fulfillment.

## User Associations

`User` records are linked to a specific `Tenant` via `tenantId`. A user's effective permissions are a combination of their assigned `Role` and the `Tenant`'s flags.

- If a user belongs to a `Tenant` with `isSupplier: true`, they gain access to the Supplier Portal.
- If the `Tenant` also has `isBuyer: true`, they can toggle between procurement and portal views (depending on their specific user permissions).

## Future Considerations

As the platform evolves, the dual role system enables easier implementation of:
- **Supplier Performance Tracking**: Cross-referencing a tenant's behavior as both buyer and seller.
- **Unified Messaging**: A single communication thread between two tenants, regardless of who is currently the buyer.
