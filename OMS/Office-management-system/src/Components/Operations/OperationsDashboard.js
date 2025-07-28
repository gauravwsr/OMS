import React, { useState, useEffect } from 'react';
import { 
  FaCogs, 
  FaChartBar, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaTruck, 
  FaWarehouse, 
  FaClipboardList, 
  FaUsers,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaEdit,
  FaPlay,
  FaPause,
  FaStop
} from 'react-icons/fa';
import './OperationsDashboard.css';

const OperationsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [operationsData, setOperationsData] = useState({
    efficiency: 0,
    activeProcesses: 0,
    alerts: 0,
    completedTasks: 0,
    processes: [],
    inventory: [],
    shipments: [],
    kpis: []
  });

  // Mock API call
  useEffect(() => {
    const fetchOperationsData = async () => {
      // Simulate API call
      setTimeout(() => {
        setOperationsData({
          efficiency: 87.5,
          activeProcesses: 23,
          alerts: 4,
          completedTasks: 156,
          processes: [
            {
              id: 1,
              name: 'Order Processing',
              status: 'running',
              efficiency: 92,
              throughput: '1,240/hour',
              lastUpdate: '2 min ago',
              alerts: 0,
              workers: 8
            },
            {
              id: 2,
              name: 'Quality Control',
              status: 'running',
              efficiency: 85,
              throughput: '850/hour',
              lastUpdate: '5 min ago',
              alerts: 1,
              workers: 6
            },
            {
              id: 3,
              name: 'Packaging Line',
              status: 'paused',
              efficiency: 78,
              throughput: '0/hour',
              lastUpdate: '15 min ago',
              alerts: 2,
              workers: 12
            },
            {
              id: 4,
              name: 'Shipping Dock',
              status: 'running',
              efficiency: 96,
              throughput: '320/hour',
              lastUpdate: '1 min ago',
              alerts: 0,
              workers: 10
            }
          ],
          inventory: [
            {
              id: 1,
              item: 'Raw Materials A',
              currentStock: 2450,
              minThreshold: 500,
              maxCapacity: 5000,
              status: 'healthy',
              location: 'Warehouse A'
            },
            {
              id: 2,
              item: 'Component B',
              currentStock: 180,
              minThreshold: 200,
              maxCapacity: 1000,
              status: 'low',
              location: 'Warehouse B'
            },
            {
              id: 3,
              item: 'Finished Product C',
              currentStock: 4800,
              minThreshold: 1000,
              maxCapacity: 5000,
              status: 'high',
              location: 'Distribution Center'
            },
            {
              id: 4,
              item: 'Packaging Materials',
              currentStock: 890,
              minThreshold: 300,
              maxCapacity: 2000,
              status: 'healthy',
              location: 'Warehouse C'
            }
          ],
          shipments: [
            {
              id: 'SH001',
              destination: 'New York, NY',
              status: 'in-transit',
              items: 45,
              priority: 'high',
              estimatedArrival: '2024-01-15',
              carrier: 'FedEx'
            },
            {
              id: 'SH002',
              destination: 'Los Angeles, CA',
              status: 'preparing',
              items: 32,
              priority: 'medium',
              estimatedArrival: '2024-01-17',
              carrier: 'UPS'
            },
            {
              id: 'SH003',
              destination: 'Chicago, IL',
              status: 'delivered',
              items: 28,
              priority: 'low',
              estimatedArrival: '2024-01-12',
              carrier: 'DHL'
            },
            {
              id: 'SH004',
              destination: 'Miami, FL',
              status: 'delayed',
              items: 67,
              priority: 'high',
              estimatedArrival: '2024-01-16',
              carrier: 'FedEx'
            }
          ],
          kpis: [
            {
              name: 'Overall Equipment Effectiveness',
              value: 82.3,
              target: 85,
              trend: 'up',
              change: '+2.1%'
            },
            {
              name: 'On-Time Delivery Rate',
              value: 94.7,
              target: 95,
              trend: 'up',
              change: '+1.3%'
            },
            {
              name: 'Inventory Turnover',
              value: 6.8,
              target: 7.5,
              trend: 'down',
              change: '-0.4%'
            },
            {
              name: 'Cost per Unit',
              value: 12.45,
              target: 12.00,
              trend: 'up',
              change: '+3.7%'
            }
          ]
        });
        setLoading(false);
      }, 1000);
    };

    fetchOperationsData();
  }, []);

  const getProcessStatusColor = (status) => {
    const colors = {
      'running': '#10b981',
      'paused': '#f59e0b',
      'stopped': '#ef4444',
      'maintenance': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getInventoryStatusColor = (status) => {
    const colors = {
      'healthy': '#10b981',
      'low': '#f59e0b',
      'high': '#3b82f6',
      'critical': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getShipmentStatusColor = (status) => {
    const colors = {
      'preparing': '#6b7280',
      'in-transit': '#3b82f6',
      'delivered': '#10b981',
      'delayed': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': '#ef4444',
      'medium': '#f59e0b',
      'low': '#10b981'
    };
    return colors[priority] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="operations-dashboard">
        <div className="loading-spinner">
          Loading Operations Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="operations-dashboard">
      <div className="dashboard-header">
        <h1>Operations Dashboard</h1>
        <p>Monitor processes, track inventory, and optimize operational efficiency</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
            <FaChartBar size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{operationsData.efficiency}%</div>
            <div className="stat-title">Overall Efficiency</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              +3.2% from last week
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <FaCogs size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{operationsData.activeProcesses}</div>
            <div className="stat-title">Active Processes</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              +2 new processes
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <FaExclamationTriangle size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{operationsData.alerts}</div>
            <div className="stat-title">Active Alerts</div>
            <div className="stat-trend">
              <FaArrowDown size={12} />
              -2 from yesterday
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <FaCheckCircle size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{operationsData.completedTasks}</div>
            <div className="stat-title">Completed Tasks</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              +12 today
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <div className="section-header">
            <h2><FaCogs /> Active Processes</h2>
            <button className="view-all-btn">Process Control</button>
          </div>
          <div className="processes-grid">
            {operationsData.processes.map(process => (
              <div key={process.id} className="process-card">
                <div className="process-header">
                  <div className="process-info">
                    <h4>{process.name}</h4>
                    <span 
                      className="process-status" 
                      style={{ backgroundColor: getProcessStatusColor(process.status) }}
                    >
                      {process.status}
                    </span>
                  </div>
                  <div className="process-controls">
                    <button className="control-btn"><FaPlay /></button>
                    <button className="control-btn"><FaPause /></button>
                    <button className="control-btn"><FaStop /></button>
                  </div>
                </div>
                <div className="process-metrics">
                  <div className="metric-row">
                    <span>Efficiency:</span>
                    <span className="metric-value">{process.efficiency}%</span>
                  </div>
                  <div className="metric-row">
                    <span>Throughput:</span>
                    <span className="metric-value">{process.throughput}</span>
                  </div>
                  <div className="metric-row">
                    <span>Workers:</span>
                    <span className="metric-value">{process.workers}</span>
                  </div>
                  <div className="metric-row">
                    <span>Alerts:</span>
                    <span className={`metric-value ${process.alerts > 0 ? 'alert' : ''}`}>
                      {process.alerts}
                    </span>
                  </div>
                </div>
                <div className="process-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${process.efficiency}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    Last updated: {process.lastUpdate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2><FaWarehouse /> Inventory Status</h2>
            <button className="view-all-btn">Manage Inventory</button>
          </div>
          <div className="inventory-table">
            <div className="table-header">
              <div>Item</div>
              <div>Current Stock</div>
              <div>Status</div>
              <div>Location</div>
              <div>Stock Level</div>
              <div>Actions</div>
            </div>
            {operationsData.inventory.map(item => (
              <div key={item.id} className="table-row">
                <div className="inventory-item">
                  <div className="item-name">{item.item}</div>
                </div>
                <div className="stock-amount">
                  {item.currentStock.toLocaleString()} units
                </div>
                <div className="inventory-status">
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getInventoryStatusColor(item.status) }}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="item-location">
                  {item.location}
                </div>
                <div className="stock-level">
                  <div className="stock-bar">
                    <div 
                      className="stock-fill" 
                      style={{ 
                        width: `${(item.currentStock / item.maxCapacity) * 100}%`,
                        backgroundColor: getInventoryStatusColor(item.status)
                      }}
                    ></div>
                  </div>
                  <span className="stock-percentage">
                    {Math.round((item.currentStock / item.maxCapacity) * 100)}%
                  </span>
                </div>
                <div className="inventory-actions">
                  <button className="action-btn"><FaEye /></button>
                  <button className="action-btn"><FaEdit /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2><FaTruck /> Shipment Tracking</h2>
            <button className="view-all-btn">All Shipments</button>
          </div>
          <div className="shipments-grid">
            {operationsData.shipments.map(shipment => (
              <div key={shipment.id} className="shipment-card">
                <div className="shipment-header">
                  <div className="shipment-id">#{shipment.id}</div>
                  <div className="shipment-priority">
                    <span 
                      className="priority-badge" 
                      style={{ backgroundColor: getPriorityColor(shipment.priority) }}
                    >
                      {shipment.priority}
                    </span>
                  </div>
                </div>
                <div className="shipment-details">
                  <div className="detail-row">
                    <span>Destination:</span>
                    <span>{shipment.destination}</span>
                  </div>
                  <div className="detail-row">
                    <span>Items:</span>
                    <span>{shipment.items} units</span>
                  </div>
                  <div className="detail-row">
                    <span>Carrier:</span>
                    <span>{shipment.carrier}</span>
                  </div>
                  <div className="detail-row">
                    <span>ETA:</span>
                    <span>{shipment.estimatedArrival}</span>
                  </div>
                </div>
                <div className="shipment-status">
                  <span 
                    className="status-indicator" 
                    style={{ backgroundColor: getShipmentStatusColor(shipment.status) }}
                  >
                    {shipment.status.replace('-', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2><FaClipboardList /> Key Performance Indicators</h2>
            <button className="view-all-btn">Detailed Reports</button>
          </div>
          <div className="kpis-grid">
            {operationsData.kpis.map((kpi, index) => (
              <div key={index} className="kpi-card">
                <div className="kpi-header">
                  <h4>{kpi.name}</h4>
                  <div className={`kpi-trend ${kpi.trend}`}>
                    {kpi.trend === 'up' ? <FaArrowUp /> : <FaArrowDown />}
                    {kpi.change}
                  </div>
                </div>
                <div className="kpi-values">
                  <div className="current-value">
                    {typeof kpi.value === 'number' && kpi.value < 100 
                      ? kpi.value.toFixed(1) 
                      : kpi.value}
                    {kpi.name.includes('Rate') ? '%' : ''}
                  </div>
                  <div className="target-value">
                    Target: {kpi.target}{kpi.name.includes('Rate') ? '%' : ''}
                  </div>
                </div>
                <div className="kpi-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%`,
                        backgroundColor: kpi.value >= kpi.target ? '#10b981' : '#f59e0b'
                      }}
                    ></div>
                  </div>
                  <div className="performance-text">
                    {kpi.value >= kpi.target ? 'Above Target' : 'Below Target'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsDashboard;
