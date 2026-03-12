pragma solidity ^0.8.13;

library ProductLib {
    struct Product {
        uint256 id;
        uint256 companyId;
        string name;
        string description;
        uint256 price;
        uint256 stock;
        string image;
        bool active;
    }

    struct ProductStorage {
        mapping(uint256 => Product) products;
        mapping(uint256 => mapping(uint256 => bool)) companyProductExists;
        mapping(uint256 => uint256[]) companyProducts;
        uint256 nextProductId;
    }

    event ProductCreated(uint256 indexed productId, uint256 indexed companyId, string name, uint256 price, uint256 indexed timestamp);
    event ProductUpdated(uint256 indexed productId, uint256 indexed companyId, string name, uint256 price, uint256 indexed timestamp);
    event ProductStatusChanged(uint256 indexed productId, uint256 indexed companyId, bool active, uint256 indexed timestamp);
    event ProductStockUpdated(uint256 indexed productId, uint256 stock, uint256 indexed timestamp);

    function addProduct(
        ProductStorage storage self,
        uint256 companyId,
        string memory name,
        string memory description,
        uint256 price,
        string memory image,
        uint256 stock
    ) external returns (uint256) {
        // Validate company exists
        require(companyId != 0, "ProductLib: Company does not exist");

        // Use post-increment to generate ID
        uint256 productId = ++self.nextProductId;

        self.products[productId] = Product({
            id: productId,
            companyId: companyId,
            name: name,
            description: description,
            price: price,
            stock: stock,
            image: image,
            active: true
        });

        self.companyProductExists[companyId][productId] = true;
        self.companyProducts[companyId].push(productId);

        emit ProductCreated(productId, companyId, name, price, block.timestamp);
        return productId;
    }

    function updateProduct(
        ProductStorage storage self,
        uint256 productId,
        string memory name,
        string memory description,
        uint256 price,
        string memory image
    ) external {
        require(self.products[productId].id != 0, "ProductLib: Product does not exist");

        Product storage product = self.products[productId];
        product.name = name;
        product.description = description;
        product.price = price;
        product.image = image;

        emit ProductUpdated(productId, product.companyId, name, price, block.timestamp);
    }

    function updateStock(ProductStorage storage self, uint256 productId, uint256 stock) external {
        require(self.products[productId].id != 0, "ProductLib: Product does not exist");

        self.products[productId].stock = stock;
        emit ProductStockUpdated(productId, stock, block.timestamp);
    }

    function decreaseStock(ProductStorage storage self, uint256 productId, uint256 quantity) external {
        require(self.products[productId].id != 0, "ProductLib: Product does not exist");
        require(self.products[productId].stock >= quantity, "ProductLib: Insufficient stock");

        self.products[productId].stock -= quantity;
        emit ProductStockUpdated(productId, self.products[productId].stock, block.timestamp);
    }

    function deactivateProduct(ProductStorage storage self, uint256 productId) external {
        require(self.products[productId].id != 0, "ProductLib: Product does not exist");
        require(self.products[productId].active, "ProductLib: Product already inactive");

        self.products[productId].active = false;
        emit ProductStatusChanged(productId, self.products[productId].companyId, false, block.timestamp);
    }

    function activateProduct(ProductStorage storage self, uint256 productId) external {
        require(self.products[productId].id != 0, "ProductLib: Product does not exist");
        require(!self.products[productId].active, "ProductLib: Product already active");

        self.products[productId].active = true;
        emit ProductStatusChanged(productId, self.products[productId].companyId, true, block.timestamp);
    }

    function getProduct(ProductStorage storage self, uint256 productId) external view returns (Product memory) {
        return self.products[productId];
    }

    function getProductsByCompany(ProductStorage storage self, uint256 companyId)
        external
        view
        returns (uint256[] memory)
    {
        return self.companyProducts[companyId];
    }

    function getAllProducts(ProductStorage storage self) external view returns (uint256[] memory) {
        // Handle case when no products exist
        if (self.nextProductId == 0) {
            return new uint256[](0);
        }
        
        uint256[] memory allProducts = new uint256[](self.nextProductId);
        uint256 count = 0;
        // Start from 1 and include nextProductId
        for (uint256 i = 1; i <= self.nextProductId; i++) {
            if (self.products[i].id != 0) {
                allProducts[count] = i;
                count++;
            }
        }

        // Create result array with exact size
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = allProducts[i];
        }
        return result;
    }

    function getPaginatedProducts(ProductStorage storage self, uint256 page, uint256 pageSize)
        external
        view
        returns (uint256[] memory, bool hasNextPage)
    {
        uint256 startIndex = page * pageSize;
        uint256 endIndex = startIndex + pageSize;
        
        if (startIndex >= self.nextProductId) {
            return (new uint256[](0), false);
        }
        
        if (endIndex > self.nextProductId) {
            endIndex = self.nextProductId;
        }
        
        uint256[] memory result = new uint256[](endIndex - startIndex);
        uint256 count = 0;
        for (uint256 i = startIndex; i < endIndex; i++) {
            uint256 productId = i + 1;
            if (self.products[productId].id != 0) {
                result[count] = productId;
                count++;
            }
        }
        
        // Create properly sized array
        uint256[] memory finalResult = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            finalResult[i] = result[i];
        }
        
        bool hasMore = endIndex < self.nextProductId;
        return (finalResult, hasMore);
    }

    function isProductAvailable(ProductStorage storage self, uint256 productId, uint256 quantity)
        external
        view
        returns (bool)
    {
        Product storage product = self.products[productId];
        return (product.id != 0 && product.active && product.stock >= quantity);
    }

    function getProductsByCompanyAndStatus(ProductStorage storage self, uint256 companyId, bool activeStatus)
        external
        view
        returns (uint256[] memory)
    {
        uint256[] memory companyProducts = self.companyProducts[companyId];
        uint256 count = 0;
        
        // First count matching products
        for (uint256 i = 0; i < companyProducts.length; i++) {
            if (self.products[companyProducts[i]].active == activeStatus) {
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < companyProducts.length; i++) {
            if (self.products[companyProducts[i]].active == activeStatus) {
                result[index] = companyProducts[i];
                index++;
            }
        }
        
        return result;
    }
}
