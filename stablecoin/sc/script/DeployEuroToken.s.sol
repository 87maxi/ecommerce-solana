// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {EuroToken} from "src/EuroToken.sol";

contract DeployEuroTokenScript is Script {
    EuroToken public euroToken;

    /**
     * @dev Script para desplegar EuroToken
     * Usa foundry para broadcast en cualquier red
     */
    function run() public {
        vm.startBroadcast();

        // Desplegar EuroToken con deployer como owner
        euroToken = new EuroToken(msg.sender);

        // Mostrar información del despliegue
        console.log("EuroToken deployed at:", address(euroToken));
        console.log("Owner:", euroToken.owner());
        console.log("Total Supply:", euroToken.totalSupply());
        console.log("Name:", euroToken.name());
        console.log("Symbol:", euroToken.symbol());
        console.log("Decimals:", euroToken.decimals());

        vm.stopBroadcast();
    }
}