import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Grid,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  AddCircleOutline,
  RemoveCircleOutline,
  Settings,
  Logout,
  ArrowBack,
} from '@mui.icons/material';
import DataManager from '../utils/dataManager'; // Corrigido: importando a exportação nomeada

// Criar e exportar instância única do DataManager
const dataManagerInstance = new DataManager();

export { dataManagerInstance as dataManager };
export default dataManagerInstance;

interface TireData {
  id: number;
  brand: string;
  model: string;
  size: string;
  pressure: number;
  wear: number; // 0 to 10
  lastInspection: string;
  nextInspection: string;
  purchaseDate: string;
  notes: string;
}

const TireCostManager: React.FC = () => {
  const [tires, setTires] = useState<TireData[]>([]);
  const [newTire, setNewTire] = useState<Omit<TireData, 'id'>>({
    brand: '',
    model: '',
    size: '',
    pressure: 0,
    wear: 0,
    lastInspection: '',
    nextInspection: '',
    purchaseDate: '',
    notes: '',
  });
  const [editingTireId, setEditingTireId] = useState<number | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const open = Boolean(anchorEl);

  useEffect(() => {
    const fetchTires = async () => {
      try {
        const data = await dataManagerInstance.getTires(); // Usando a instância
        setTires(data);
      } catch (error) {
        console.error('Failed to fetch tires:', error);
        // Handle error appropriately, e.g., show a message to the user
      }
    };
    fetchTires();
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAddTire = async () => {
    try {
      // Basic validation
      if (
        !newTire.brand ||
        !newTire.model ||
        !newTire.size ||
        newTire.wear < 0 ||
        newTire.wear > 10 ||
        !newTire.purchaseDate ||
        !newTire.nextInspection
      ) {
        alert('Please fill in all required fields and ensure wear is between 0 and 10.');
        return;
      }

      const addedTire = await dataManagerInstance.addTire(newTire); // Usando a instância
      setTires([...tires, addedTire]);
      setNewTire({
        brand: '',
        model: '',
        size: '',
        pressure: 0,
        wear: 0,
        lastInspection: '',
        nextInspection: '',
        purchaseDate: '',
        notes: '',
      });
    } catch (error) {
      console.error('Failed to add tire:', error);
      alert('Failed to add tire. Please try again.');
    }
  };

  const handleUpdateTire = async () => {
    if (editingTireId === null) return;
    try {
      // Basic validation
      if (
        !newTire.brand ||
        !newTire.model ||
        !newTire.size ||
        newTire.wear < 0 ||
        newTire.wear > 10 ||
        !newTire.purchaseDate ||
        !newTire.nextInspection
      ) {
        alert('Please fill in all required fields and ensure wear is between 0 and 10.');
        return;
      }

      const updatedTire = await dataManagerInstance.updateTire(editingTireId, newTire); // Usando a instância
      setTires(tires.map((tire) => (tire.id === editingTireId ? updatedTire : tire)));
      setEditingTireId(null);
      setNewTire({
        brand: '',
        model: '',
        size: '',
        pressure: 0,
        wear: 0,
        lastInspection: '',
        nextInspection: '',
        purchaseDate: '',
        notes: '',
      });
    } catch (error) {
      console.error('Failed to update tire:', error);
      alert('Failed to update tire. Please try again.');
    }
  };

  const handleDeleteTire = async (id: number) => {
    try {
      await dataManagerInstance.deleteTire(id); // Usando a instância
      setTires(tires.filter((tire) => tire.id !== id));
    } catch (error) {
      console.error('Failed to delete tire:', error);
      alert('Failed to delete tire. Please try again.');
    }
  };

  const handleEditClick = (tire: TireData) => {
    setEditingTireId(tire.id);
    setNewTire({ ...tire });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setNewTire((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumericInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const numericValue = parseFloat(value);
    setNewTire((prev) => ({ ...prev, [name]: isNaN(numericValue) ? 0 : numericValue }));
  };

  const handleCancelEdit = () => {
    setEditingTireId(null);
    setNewTire({
      brand: '',
      model: '',
      size: '',
      pressure: 0,
      wear: 0,
      lastInspection: '',
      nextInspection: '',
      purchaseDate: '',
      notes: '',
    });
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleClose();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="back"
            sx={{ mr: 2 }}
            onClick={() => navigate('/dashboard')}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Tire Cost Manager
          </Typography>
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleClick}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <Avatar sx={{ width: 32, height: 32 }}>T</Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              color: 'background.paper',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem>
          <Avatar /> Profile
        </MenuItem>
        <MenuItem>
          <Avatar /> My account
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleNavigate('/settings')}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom align="center">
            Manage Your Tires
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                {editingTireId !== null ? 'Edit Tire' : 'Add New Tire'}
              </Typography>
              <Box
                component="form"
                noValidate
                sx={{ mt: 1 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  editingTireId !== null ? handleUpdateTire() : handleAddTire();
                }}
              >
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Brand"
                  name="brand"
                  autoComplete="off"
                  value={newTire.brand}
                  onChange={handleInputChange}
                  sx={{ backgroundColor: '#f9f9f9' }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Model"
                  name="model"
                  autoComplete="off"
                  value={newTire.model}
                  onChange={handleInputChange}
                  sx={{ backgroundColor: '#f9f9f9' }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Size (e.g., 205/55R16)"
                  name="size"
                  autoComplete="off"
                  value={newTire.size}
                  onChange={handleInputChange}
                  sx={{ backgroundColor: '#f9f9f9' }}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label="Pressure (PSI)"
                  name="pressure"
                  type="number"
                  autoComplete="off"
                  value={newTire.pressure}
                  onChange={handleNumericInputChange}
                  sx={{ backgroundColor: '#f9f9f9' }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Wear (0-10)"
                  name="wear"
                  type="number"
                  autoComplete="off"
                  value={newTire.wear}
                  onChange={handleNumericInputChange}
                  inputProps={{ min: 0, max: 10 }}
                  sx={{ backgroundColor: '#f9f9f9' }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Last Inspection Date (YYYY-MM-DD)"
                  name="lastInspection"
                  type="date"
                  autoComplete="off"
                  value={newTire.lastInspection}
                  onChange={handleInputChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{ backgroundColor: '#f9f9f9' }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Next Inspection Date (YYYY-MM-DD)"
                  name="nextInspection"
                  type="date"
                  autoComplete="off"
                  value={newTire.nextInspection}
                  onChange={handleInputChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{ backgroundColor: '#f9f9f9' }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Purchase Date (YYYY-MM-DD)"
                  name="purchaseDate"
                  type="date"
                  autoComplete="off"
                  value={newTire.purchaseDate}
                  onChange={handleInputChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{ backgroundColor: '#f9f9f9' }}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label="Notes"
                  name="notes"
                  multiline
                  rows={3}
                  autoComplete="off"
                  value={newTire.notes}
                  onChange={handleInputChange}
                  sx={{ backgroundColor: '#f9f9f9' }}
                />
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={editingTireId !== null ? null : <AddCircleOutline />}
                    sx={{ px: 4 }}
                  >
                    {editingTireId !== null ? 'Update Tire' : 'Add Tire'}
                  </Button>
                  {editingTireId !== null && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleCancelEdit}
                      startIcon={<RemoveCircleOutline />}
                      sx={{ px: 4 }}
                    >
                      Cancel Edit
                    </Button>
                  )}
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Tire Inventory
              </Typography>
              <Paper elevation={2} sx={{ maxHeight: 500, overflow: 'auto', p: 2 }}>
                {tires.length === 0 ? (
                  <Typography color="textSecondary">No tires added yet.</Typography>
                ) : (
                  tires.map((tire) => (
                    <Paper
                      key={tire.id}
                      elevation={1}
                      sx={{
                        mb: 2,
                        p: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#f9f9f9',
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1">
                          {tire.brand} {tire.model} ({tire.size})
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Wear: {tire.wear}/10 | Next Insp:{' '}
                          {new Date(tire.nextInspection).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleEditClick(tire)}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDeleteTire(tire.id)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Paper>
                  ))
                )}
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default TireCostManager;