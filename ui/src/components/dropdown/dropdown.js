import Dropdown from 'react-bootstrap/Dropdown'
import 'bootstrap/dist/css/bootstrap.min.css'
import DropdownButton from 'react-bootstrap/DropdownButton'
import Table from 'react-bootstrap/Table'
import Form from 'react-bootstrap/Form'
import React, { useEffect, useState } from "react"
import Button from 'react-bootstrap/Button'
import axios from 'axios'

/**
 * React dropdown menu
 * Source: https://react-bootstrap.github.io/components/dropdowns/
 */
function UserButton() {
  const [elasticData, setElastic] = useState(null)
  const [userid, setUserId] = useState(null)
  const [username, setUsername] = useState(null)
  const [similarityMethod, setSimilarityMethod] = useState(null)
  const [similarityMethodName, setSimilarityMethodName] = useState(null)
  const [numberOfResults, setNumberOfResults] = useState(null)
  const [topUsers, setTopUsers] = useState(null)
  const [movieRec, setMovieRec] = useState(null)

  useEffect(() => {
    // GET all available Users
    axios.get('http://localhost:8000/users').then((response) => {
      setElastic(response.data.aggregations.docker.buckets)
    })
  }, [])

  // parsing user id and name
  function handleUserChange(userId) {
    const details = userId.split(",")
    setUserId(details[0])
    // Updates username in button
    setUsername(details[1])
  }

  function handleSimilarityMethod(similarityMethod) {
    const simMethod = similarityMethod.split(",")
    setSimilarityMethod(simMethod[0])
    // Updates similarity method name in button
    setSimilarityMethodName(simMethod[1])
  }

  function handleNumberOfResults(numResults) {
    setNumberOfResults(numResults.nativeEvent.data)
  }

  function handleSimilarityMethodChange(e) {
    if (userid) {
      const data = JSON.stringify({
        simMtd: similarityMethod,
        userId: userid,
        num: numberOfResults
      })

      if (e.target.id === 'topusers') {
      axios({
        method: 'post',
        url: 'http://localhost:8000/topusers',
        headers: {'Content-Type': 'application/json'},
        data: data
      }).then((response) => {
        console.log(response.data)
        setTopUsers(response.data)
        setMovieRec(null)
      })
    } else if (e.target.id === 'movierec') {
      axios({
        method: 'post',
        url: 'http://localhost:8000/movierecommendations',
        headers: {'Content-Type': 'application/json'},
        data: data
      }).then((response) => {
        console.log(response.data)
        setMovieRec(response.data)
        setTopUsers(null)
      })
    }
    }
  }

  if (!elasticData) return "No Content"

  return (
    <div style={{ display: "flex", 'justifyContent': 'center', padding: '50px'}}>
      <DropdownButton id="dropdown-button" title={username || "Users" } style={{padding: '10px'}} onSelect={handleUserChange}>
          {elasticData.map(d => (<Dropdown.Item eventKey={[d.key[1], d.key[0]]}>{d.key[0]}</Dropdown.Item>))} 
      </DropdownButton>

      <DropdownButton id="dropdown-button" title={similarityMethodName || "Similarity"} style={{padding: '10px'}} onSelect={handleSimilarityMethod}>
        <Dropdown.Item eventKey={['1', 'Euclidean']}>Euclidean</Dropdown.Item>
        <Dropdown.Item eventKey={['2', 'Pearson']}>Pearson</Dropdown.Item>
      </DropdownButton>

      <Form>
        <Form.Group className="mb-3" controlId="formBasicEmail" style={{padding: '10px', width: '150px'}}>
        <Form.Control type="results" onChange={handleNumberOfResults} placeholder="# of results" />
        </Form.Group>
      </Form>

      <div style={{ display: "flex", position: "absolute", "marginTop": "100px"}}>
        <Button variant="success" id="topusers" onClick={handleSimilarityMethodChange}>Find top matching users</Button>{' '}
      </div>

      <div style={{ display: "flex", position: "absolute", "marginTop": "100px", marginRight: "500px"}}>
      <Button variant="success" id="movierec" onClick={handleSimilarityMethodChange}>Find movie recommendations</Button>{' '}
      </div>
        
      {topUsers &&
        <div style={{ display: "flex", position: "absolute", "marginTop": "200px"}}>
          <h3>Results</h3>

        <div style={{ display: "flex", position: "absolute", "marginTop": "75px"}}>
          <Table striped bordered hover size="lg">
          <thead>
            <tr>
              <th>Movie</th>
              <th>ID</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
          {topUsers.map(d => (<tr>{d.name} <td>{d.userId}</td> <td>{d.simScore.toFixed(4)}</td></tr>))}
          </tbody>
        </Table> 
          </div>
        </div>
      }

{movieRec &&
    <div style={{ display: "flex", position: "absolute", "marginTop": "200px", "width": 200}}>
        <h3>Results</h3>

      <div style={{ display: "flex", position: "absolute", "marginTop": "75px" }}>
        <Table striped bordered hover size="lg">
        <thead>
          <tr>
            <th>MovieTitle</th>
            <th>Recommendation Score</th>
          </tr>
        </thead>
        <tbody>
          {movieRec.map(d => (<tr>{d.movieTitle} <td>{d.recScore}</td></tr>))}
        </tbody>
      </Table> 
        </div>
      </div>
      }
    </div>
  )
}

export default UserButton;
