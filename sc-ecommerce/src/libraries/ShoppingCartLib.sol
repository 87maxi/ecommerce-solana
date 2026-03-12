pragma solidity ^0.8.13;

// Import ProductLib
import {ProductLib} from "../libraries/ProductLib.sol";

library ShoppingCartLib {
    // External reference to ProductLib
    // We need to access the productStorage from the main contract
    // This function will be called with the correct storage reference passed from the main contract
    struct CartItem {
        uint256 productId;
        uint256 quantity;
    }

    struct ShoppingCart {
        CartItem[] items;
    }

    struct ShoppingCartStorage {
        mapping(address => ShoppingCart) carts;
        mapping(address => mapping(uint256 => uint256)) itemIndex;
    }

    event ItemAddedToCart(address indexed customer, uint256 indexed productId, uint256 quantity);
    event ItemRemovedFromCart(address indexed customer, uint256 indexed productId);
    event QuantityUpdated(address indexed customer, uint256 indexed productId, uint256 quantity);
    event CartCleared(address indexed customer);
    event QuantitiesUpdated(address indexed customer, uint256[] productIds, uint256[] quantities);

    function addToCart(ShoppingCartStorage storage self, address customer, uint256 productId, uint256 quantity)
        external
    {
        require(quantity > 0, "ShoppingCartLib: Quantity must be greater than 0");

        ShoppingCart storage cart = self.carts[customer];
        uint256 index = self.itemIndex[customer][productId];

        if (cart.items.length == 0) {
            // Cart is empty, add item
            cart.items.push(CartItem({productId: productId, quantity: quantity}));
            self.itemIndex[customer][productId] = cart.items.length;

            emit ItemAddedToCart(customer, productId, quantity);
        } else if (self.itemIndex[customer][productId] == 0) {
            // Item not in cart, add it
            cart.items.push(CartItem({productId: productId, quantity: quantity}));
            self.itemIndex[customer][productId] = cart.items.length;

            emit ItemAddedToCart(customer, productId, quantity);
        } else {
            // Item already in cart, update quantity
            cart.items[index - 1].quantity += quantity;

            emit QuantityUpdated(customer, productId, cart.items[index - 1].quantity);
        }
    }

    function removeFromCart(ShoppingCartStorage storage self, address customer, uint256 productId) external {
        ShoppingCart storage cart = self.carts[customer];
        uint256 index = self.itemIndex[customer][productId];

        require(cart.items.length > 0, "ShoppingCartLib: Cart is empty");
        require(index > 0 && cart.items[index - 1].productId == productId, "ShoppingCartLib: Item not in cart");

        uint256 lastIndex = cart.items.length - 1;
        uint256 lastProductId = cart.items[lastIndex].productId;

        // Move the last item to the place of the removed item
        cart.items[index - 1] = cart.items[lastIndex];

        // Update the index of the moved item
        self.itemIndex[customer][lastProductId] = index;

        // Remove the last item
        cart.items.pop();

        // Clear the index of the removed item
        self.itemIndex[customer][productId] = 0;

        emit ItemRemovedFromCart(customer, productId);
    }

    function updateQuantity(ShoppingCartStorage storage self, address customer, uint256 productId, uint256 quantity)
        external
    {
        require(quantity > 0, "ShoppingCartLib: Quantity must be greater than 0");

        ShoppingCart storage cart = self.carts[customer];
        uint256 index = self.itemIndex[customer][productId];

        require(cart.items.length > 0, "ShoppingCartLib: Cart is empty");
        require(index > 0 && cart.items[index - 1].productId == productId, "ShoppingCartLib: Item not in cart");

        cart.items[index - 1].quantity = quantity;

        emit QuantityUpdated(customer, productId, quantity);
    }

    function getCart(ShoppingCartStorage storage self, address customer) external view returns (CartItem[] memory) {
        return self.carts[customer].items;
    }

    function clearCart(ShoppingCartStorage storage self, address customer) external {
        delete self.carts[customer];

        // Clear all indices for this customer
        // Since we can't iterate over mappings, we'll handle this in the context if needed
        // For now, we just delete the cart
        emit CartCleared(customer);
    }

    // Calculate total price of items in cart
    // Validates that products exist and are active
    function calculateTotal(
        ShoppingCartStorage storage self,
        ProductLib.ProductStorage storage productStorage,
        address customer
    ) external view returns (uint256) {
        CartItem[] memory items = self.carts[customer].items;
        uint256 total = 0;
        
        for (uint256 i = 0; i < items.length; i++) {
            ProductLib.Product storage product = productStorage.products[items[i].productId];
            // Validate product exists and is active
            require(product.id != 0, "ShoppingCartLib: Product does not exist");
            require(product.active, "ShoppingCartLib: Product is not active");
            
            total += product.price * items[i].quantity;
        }
        
        return total;
    }

    function getCartItemCount(ShoppingCartStorage storage self, address customer) external view returns (uint256) {
        return self.carts[customer].items.length;
    }

    function batchUpdateQuantities(
        ShoppingCartStorage storage self,
        address customer,
        uint256[] memory productIds,
        uint256[] memory quantities
    ) external {
        require(productIds.length == quantities.length, "ShoppingCartLib: Array length mismatch");
        
        ShoppingCart storage cart = self.carts[customer];
        
        for (uint256 i = 0; i < productIds.length; i++) {
            uint256 productId = productIds[i];
            uint256 quantity = quantities[i];
            
            require(quantity > 0, "ShoppingCartLib: Quantity must be greater than 0");
            
            uint256 index = self.itemIndex[customer][productId];
            
            require(cart.items.length > 0, "ShoppingCartLib: Cart is empty");
            require(index > 0 && cart.items[index - 1].productId == productId, "ShoppingCartLib: Item not in cart");
            
            cart.items[index - 1].quantity = quantity;
        }
        
        emit QuantitiesUpdated(customer, productIds, quantities);
    }

    function batchAddToCart(
        ShoppingCartStorage storage self,
        address customer,
        uint256[] memory productIds,
        uint256[] memory quantities
    ) external {
        require(productIds.length == quantities.length, "ShoppingCartLib: Array length mismatch");
        
        for (uint256 i = 0; i < productIds.length; i++) {
            // Direct implementation of addToCart logic
            require(quantities[i] > 0, "ShoppingCartLib: Quantity must be greater than 0");

            ShoppingCart storage cart = self.carts[customer];
            uint256 index = self.itemIndex[customer][productIds[i]];

            if (cart.items.length == 0) {
                // Cart is empty, add item
                cart.items.push(CartItem({productId: productIds[i], quantity: quantities[i]}));
                self.itemIndex[customer][productIds[i]] = cart.items.length;

                emit ItemAddedToCart(customer, productIds[i], quantities[i]);
            } else if (self.itemIndex[customer][productIds[i]] == 0) {
                // Item not in cart, add it
                cart.items.push(CartItem({productId: productIds[i], quantity: quantities[i]}));
                self.itemIndex[customer][productIds[i]] = cart.items.length;

                emit ItemAddedToCart(customer, productIds[i], quantities[i]);
            } else {
                // Item already in cart, update quantity
                cart.items[index - 1].quantity += quantities[i];

                emit QuantityUpdated(customer, productIds[i], cart.items[index - 1].quantity);
            }
        }
    }

    function batchRemoveFromCart(
        ShoppingCartStorage storage self,
        address customer,
        uint256[] memory productIds
    ) external {
        for (uint256 i = 0; i < productIds.length; i++) {
            // Direct implementation of removeFromCart logic
            ShoppingCart storage cart = self.carts[customer];
            uint256 index = self.itemIndex[customer][productIds[i]];

            require(cart.items.length > 0, "ShoppingCartLib: Cart is empty");
            require(index > 0 && cart.items[index - 1].productId == productIds[i], "ShoppingCartLib: Item not in cart");

            uint256 lastIndex = cart.items.length - 1;
            uint256 lastProductId = cart.items[lastIndex].productId;

            // Move the last item to the place of the removed item
            cart.items[index - 1] = cart.items[lastIndex];

            // Update the index of the moved item
            self.itemIndex[customer][lastProductId] = index;

            // Remove the last item
            cart.items.pop();

            // Clear the index of the removed item
            self.itemIndex[customer][productIds[i]] = 0;

            emit ItemRemovedFromCart(customer, productIds[i]);
        }
    }
}
