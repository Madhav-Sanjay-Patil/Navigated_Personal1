// The SummaryExamples component displays example summaries related to mathematical concepts, styled with Material-UI's dark theme.
// It includes a back button to navigate to the previous course page, 
// and showcases examples like groups, subgroups, and sets, using Paper components for presentation.
import { useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#a161eef3',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

const examples = [
  {
    title: 'Groups, Fields, and Rings',
    content: `What I understood from groups, fields, and rings is that a Group is a set in which you can perform only one operation, either addition or multiplication, and it must follow four rules: closure, associativity, identity, and inverses. Closure means that if you perform the operation on any two elements in the set, the result is also in the set. Associativity means that how you group the elements doesn't change the result. The identity element means there is a special element in the set that doesn't change any element when you perform the operation with it. Inverses mean that for every element in the set, there's another element that combines with it to give the identity element. A Ring is a set equipped with two operations, addition and multiplication, but the multiplication operation does not always have to form a group. A Ring is always a group under addition, meaning the addition operation satisfies the group rules. Finally, a Field is a special type of Ring where both addition and multiplication form groups. So, in a Field, both operations have an identity element, and every element has an inverse for both addition and multiplication.`,
  },
  {
    title: 'Subgroups',
    content: `The meaning of a subgroup that I understood is that a subgroup is a subset of a group, and it inherits the structure of the group it belongs to. A subset H is called a subgroup of a group G if it satisfies certain conditions. First, H must be a non-empty subset of G. Second, H should be closed under the group operation, meaning that if you take any two elements from H, their result under the group operation must also be in H. Third, H must contain the identity element of G, the element that leaves every element unchanged when the group operation is applied. Finally, for each element in H, its inverse must also be in H. These four conditions (non-empty, closure, identity element, and inverse) are what ensure that H forms a subgroup of G. In simple terms, this means that H behaves like a group on its own, with the same operation as the original group G, but it is just a smaller part of G. This structure makes subgroups an important concept in the study of groups.`,
  },
  {
    title: 'Sets',
    content: `What I learned is that sets in mathematics are just a collection of distinct objects. These objects can be anything—numbers, days of the week, types of vehicles, or other items. A set is made up of unique elements, meaning no repeats. For example, the set of days in a week would be written as {Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday} Sets help organize things in mathematics and allow us to do operations like finding common elements (intersection) or combining all elements (union). A set can have a fixed number of elements, called a finite set, or it can go on forever, like the set of all natural numbers. Sets are an easy way to group and work with collections of items.`,
  },
];

const SummaryExamples = () => {
    const navigate = useNavigate();
    const handleBackClick = () => {
		navigate('/course');
	  };
  return (
    <ThemeProvider  theme={darkTheme}>
      <CssBaseline />
      <Container  sx={{ py: 4,justifyContent:"center",textAlign:"center",border:"2px solid black" ,my:"5px" ,backgroundColor:"#121212",borderRadius: "5px",maxWidth:"800px"}}>
        <Typography variant="h3" component="h1"  sx={{ color: 'primary.main' }}>
          Summary Examples
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 ,color:'secondary.main',fontWeight:'700'}}>
          Here are some examples of well-written summaries to guide you in submitting your own.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {examples.map((example, index) => (
            <Paper key={index} elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h5" component="h2"  sx={{ color: 'secondary.main' }}>
                Example {index}:
              </Typography>
              
              <Typography variant="h5" component="h2"  sx={{ color: 'secondary.main' }}>  
              <span style={{color: '#f48fb1',fontSize:"1.5rem",textDecoration:'underline'}}>Title</span>
              <span style={{color: '#f48fb1',fontSize:"1.5rem"}}> - </span>
                {example.title}
              </Typography>
              
              <Typography variant="body1">
                <span style={{color: '#f48fb1',fontSize:"20px",textDecoration:'underline'}}>Summary</span>
                <span style={{color: '#f48fb1',fontSize:"20px"}}> : </span>
                {example.content}</Typography>
            </Paper>
          ))}
        </Box>
        <Button sx={{mt:2}} onClick={handleBackClick} variant="contained">Go Back</Button>
      </Container>
      
    </ThemeProvider>
  );
};

export default SummaryExamples;
