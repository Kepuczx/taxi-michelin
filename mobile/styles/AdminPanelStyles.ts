// mobile/styles/AdminPanelStyles.ts
import { StyleSheet } from 'react-native';

export const AdminPanelStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#0a1d56',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 4,
    borderBottomColor: '#FFD700',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoImage: {
    width: 180,
    height: 50,
    backgroundColor: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  menuScroll: {
    backgroundColor: '#e0e0e0',
  },
  menuContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  menuButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  menuButtonActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#0a1d56',
  },
  menuButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  menuButtonTextActive: {
    color: '#0a1d56',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#0a1d56',
  },
  roleButtonText: {
    color: '#333',
  },
  roleButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 50,
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0a1d56',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    color: 'white',
    fontWeight: 'bold',
  },
  tableBody: {
    maxHeight: 500,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
  },
  deleteButton: {
    width: 40,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
  },
  editButton: {
    width: 40,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 18,
  },
  vehicleSelector: {
    marginBottom: 16,
  },
  vehicleButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  vehicleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  vehicleButtonActive: {
    backgroundColor: '#0a1d56',
  },
  vehicleButtonText: {
    color: '#333',
  },
  vehicleButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  placeholderSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  menuButton: {
  padding: 10,
},
overlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  zIndex: 1000,
},
sideMenu: {
  position: 'absolute',
  top: 0,
  right: -280,
  width: 280,
  height: '100%',
  backgroundColor: '#fff',
  zIndex: 1001,
  paddingTop: 50,
  shadowColor: '#000',
  shadowOffset: { width: -2, height: 0 },
  shadowOpacity: 0.2,
  shadowRadius: 5,
  elevation: 5,
  transition: 'right 0.3s ease',
},
sideMenuOpen: {
  right: 0,
},
sideMenuHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 20,
  paddingBottom: 20,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
  marginBottom: 20,
},
sideMenuHeaderText: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#0a1d56',
},
closeMenuButton: {
  padding: 5,
},
sideMenuItem: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 20,
  paddingVertical: 15,
  gap: 15,
},
sideMenuItemActive: {
  backgroundColor: '#e8f0fe',
  borderLeftWidth: 3,
  borderLeftColor: '#0a1d56',
},
sideMenuItemText: {
  fontSize: 16,
  color: '#555',
},
sideMenuItemTextActive: {
  color: '#0a1d56',
  fontWeight: 'bold',
},
sideMenuDivider: {
  height: 1,
  backgroundColor: '#eee',
  marginVertical: 10,
},
});