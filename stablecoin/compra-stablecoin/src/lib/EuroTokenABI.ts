const EuroTokenABI = [
  // Función mint(address to, uint256 amount)
  "function mint(address to, uint256 amount) external",
  
  // Función balanceOf(address account) view returns (uint256)
  "function balanceOf(address account) external view returns (uint256)",
  
  // Evento de transferencia (opcional)
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

export default EuroTokenABI;