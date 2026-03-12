// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EuroToken
 * @dev Implementación de una stablecoin EURT 1:1 con el Euro
 * - Suministro inicial: 0 tokens
 * - Decimales: 6 (para representar céntimos)
 * - Tokens se acuñan bajo demanda
 */
contract EuroToken is ERC20, Ownable {
    // Redefinir decimales a 6 para mejor precisión con euros
    uint8 private constant _DECIMALS = 6;
    uint256 private constant _HALF_UNIT = 10**5; // 0.1 euro en unidades base

    /**
     * @dev Constructor: inicializa token con nombre, símbolo y dueño
     * @param initialOwner Dirección del propietario inicial
     */
    constructor(address initialOwner) ERC20("EuroToken", "EURT") Ownable(initialOwner) {
        // No se acuñan tokens en el constructor - se hace bajo demanda
    }

    /**
     * @dev Retorna decimales del token (sobreescritura)
     * @return uint8 Cantidad de decimales (6)
     */
    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /**
     * @dev Acuña nuevos tokens
     * @param to Dirección destino
     * @param amount Cantidad en unidades base (10^18)
     * @dev Solo el propietario puede llamar
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Quema tokens del remitente
     * @param amount Cantidad a quemar
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    /**
     * @dev Quema tokens de otra cuenta (con allowance)
     * @param account Cuenta del propietario de los tokens
     * @param amount Cantidad a quemar
     */
    function burnFrom(address account, uint256 amount) public {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
    }
}