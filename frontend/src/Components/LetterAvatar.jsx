// This LetterAvatar component is a user profile avatar that triggers a pop-up menu when clicked, displaying the user's name, email, and two buttons 
// for navigation or signing out. It uses Material-UI components like Avatar, Popper, and Card for UI elements. Upon clicking the avatar, a Popper
// component appears showing the user's details and two action buttons: one for navigating to a simulator page and another for signing out. 
// The handleClick method toggles the visibility of the pop-up menu, while the handleSignOut method clears the user’s session and sets the 
// login state to false. The component utilizes the ThemeProvider to apply a dark theme to its child components.
import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Avatar, Box, Card, CardContent, Typography, Button, Popper, ClickAwayListener } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const LetterAvatar = ({ setIsLoggedIn }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const name = localStorage.getItem("name");
  const email = localStorage.getItem("username");

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen((prev) => !prev);
  };

  const handleClickAway = () => {
    setOpen(false);
  };

  const handleSignOut = () => {
    console.log("Sign out clicked");
    setIsLoggedIn(false);
    localStorage.clear();
  };

  return (
    <ThemeProvider theme={darkTheme}>

      <Avatar
        id='nav-profile'
        onClick={handleClick}
        sx={{
          bgcolor: 'primary.main',
          cursor: 'pointer',
          width: 45,
          height: 45,
          fontSize: '1.5rem',
          marginLeft: 'auto'
        }}
      >
        {name[0]}
      </Avatar>

      <Popper open={open} anchorEl={anchorEl} placement="bottom-start">
        <ClickAwayListener onClickAway={handleClickAway}>
          <Card sx={{ width: 300, mt: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {email}
              </Typography>
              <Button
                variant='contained'
                color='secondary'
                fullWidth
                onClick={() => { navigate('/simulator'); }}
                sx={{ mt: 2 }}
              >
                Simulator
              </Button>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={handleSignOut}
                sx={{ mt: 2 }}
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </ClickAwayListener>
      </Popper>

    </ThemeProvider>
  );
};

export default LetterAvatar;
