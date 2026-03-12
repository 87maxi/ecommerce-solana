# Shopping Cart Logic Implementation

## Issue Analysis
The original shopping cart logic had a complex and potentially buggy condition for adding items to the cart:

```solidity
if (
    cart.items.length == 0 || self.itemIndex[customer][productId] == 0
        && cart.items[index].productId != productId
)
```

This condition combined multiple checks with ambiguous precedence, potentially leading to incorrect behavior.

## Solution Implemented

1. Split the complex condition into clearer, sequential checks:
   - First check if cart is empty
   - Then check if product is not in cart (index == 0)
   - Otherwise, product is already in cart

2. Simplified the logic flow to make it more readable and maintainable

3. Preserved the same functionality but with more predictable behavior

## Benefits
- Improved code readability
- Reduced risk of logical errors
- Easier to maintain and extend
- Clearer intent in the code logic