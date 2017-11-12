import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class Screen extends React.Component{
    render(){
        return(
            <div className="screen">
               <div> {this.props.value}</div>
            </div>
        );
    }
}
class Button extends React.Component{
    
    render(){
        return(
            <button className="key btn" onClick={this.props.onClick}>
            {this.props.value}
            </button>
        );
    }
}
class Calculator extends React.Component{
    
    constructor(){
        super();
        this.state={
            currentOperation:"",
            decimalSet:false,
            parensOpen:0
        };
    }
    
    handleClick(value,operator){
        var currentOp = this.state.currentOperation;
        var decimalSet = this.state.decimalSet;
        var parensOpen = this.state.parensOpen;
        let lastVal = currentOp.length>0 ? currentOp[currentOp.length-1] : null;
        //currentOp might be infinity (due to a division by zero in a previous expression evaluation), if so reset when a new button is clicked
        if(currentOp==="Infinity" || currentOp==="-Infinity")
            currentOp= "";

        
        
        if(operator){
            //if the button clicked is an operator (add,subtract,multiply,etc)
            if(value==="clear"){//if the clear button was pressed, clear the current operation
                currentOp= ""
                parensOpen=0;//clear parenthesis for new expression
            }else if(value==="back"){
                if(!endsWithScientificNotation(currentOp)){
                    currentOp= currentOp.substr(0,currentOp.length-1);
                    if(lastVal==="(") parensOpen--;
                    if(lastVal===")") parensOpen++;
                    if(lastVal===".") decimalSet=false;
                }
            }else //otherwise, update the current operation based on operator
                currentOp = this.processOperator(value,currentOp,parensOpen);
            decimalSet=false; //operator separates numbers, so a new number is to be added (and we reset decimalSet for this number)
        }else if(value==="."){
            //add decimal point to current number of operation only if no other decimal point has been set
            if(!decimalSet){
                currentOp+=value;
                decimalSet=true;
            }
            //otherwise, decimal is not added
        }else if(value==="("){
            if(!isValidExpression(lastVal)){//if last value isn't the end of a valid expression we can start an open parenthesis
                currentOp+=value;
                parensOpen++;
            }
        }else if(value===")"){
            if(isValidExpression(lastVal) && parensOpen>0){//if there is at least one preceding open parenthesis and last value is the end of a valid expression we can close the parentheses
                currentOp+=value;
                parensOpen--;
            }
        }else { 
            //else, the value must be a digit 0-9, add the digit to current operation, if the previous digit is a zero and is the first digit, remove it
            let secondToLast = currentOp.length>1 ? currentOp[currentOp.length-2] : null;
            if(lastVal==="0" && !isDigit(secondToLast))//if there is a previous zero that is the first digit, replace it with the new digit 
                currentOp= currentOp.substr(0,currentOp.length-1)+value;
            else
                currentOp+=value;//otherwise, just append the digit as usual
        }
        this.setState({currentOperation:currentOp,decimalSet:decimalSet,parensOpen:parensOpen});
    }
    renderButton(value,operator){
        return <Button value={value} onClick={() => this.handleClick(value,operator)}/>
    }
    render(){
        return(
            <div className="calculator">
                <Screen value={this.state.currentOperation}/>
                <div className="calculator-row">
                    {this.renderButton(7,false)}
                    {this.renderButton(8,false)}
                    {this.renderButton(9,false)}
                    {this.renderButton('=',true)}
                </div>
                <div className="calculator-row">
                    {this.renderButton(4,false)}
                    {this.renderButton(5,false)}
                    {this.renderButton(6,false)}
                    {this.renderButton('+',true)}
                </div>
                <div className="calculator-row">
                    {this.renderButton(1,false)}
                    {this.renderButton(2,false)}
                    {this.renderButton(3,false)}
                    {this.renderButton('-',true)}
                </div>
                <div className="calculator-row">
                    {this.renderButton(0,false)}
                    {this.renderButton(".",false)}
                    {this.renderButton("×",true)}
                    {this.renderButton("÷",true)}
                </div>
                <div className="calculator-row">
                    {this.renderButton("(",false)}
                    {this.renderButton(")",false)}
                    {this.renderButton("clear",true)}
                    {this.renderButton("back",true)}
                </div>

            </div>
        );
    }
    
    //returns the updated version of currentOp (operation string) after adding the given operator
    //also requires openParens, the number of unclosed parentheses currently in currentOp
    processOperator(operator,currentOp,openParens){
        let lastVal = currentOp.length>0 ? currentOp[currentOp.length-1] : null;
        
        if(isValidExpression(lastVal)){
            //if the last value is the end of a valid expression, we can freely add our operator
            if(operator==="=" && openParens===0){//special operator = will return the result of the current operation, unless current operation still has open parentheses
                return evaluateExpression(currentOp).toString();
            }else if(operator!=="=")//for all other operators, value is appended to current operation
                currentOp+=operator;
        }else if(operator==="-"){//if operator is minus and last part of expression is not a digit
            if(lastVal){//last part of expression is either an operator or null, if an operator
                if(lastVal==="+")//change + to - since (+-) is equivalent to -
                    currentOp= currentOp.substr(0,currentOp.length-1) + "-";
                else if(lastVal==="-"){
                    if(!unaryMinus(currentOp,currentOp.length-1))// change - to + since (--) is equivalent to + (only if "-" isn't unary)
                        currentOp= currentOp.substr(0,currentOp.length-1) + "+";
                }else //for all other operators just append the minus sign
                    currentOp += operator;
            }else
                currentOp+=operator;
        }
        return currentOp;
    }

}

//returns true if char is a character that is a digit from  0-9, or a decimal point (returns false otherwise)
function isDigit(char){
    if(!char) return false; //return false if null
    return ("0" <= char && char <= "9") || char===".";
}

//returns true if char indicates end of a valid expression (char is a digit 0-9, decimal point, or closedparentheses), returns false otherwise
//ie. -1, 5-2, (4-2*3), and 2+3.5 are valid expressions, 1-, 2.0+ are not
function isValidExpression(char){
    return isDigit(char) || char===")";
}

function evaluateExpression(operationString){
    /*convert the infix expression string to a postfix expression array, which is an array of numbers (representing operands) and characters (representing operators) */
    var postfix = infixToPostfix(operationString);
    var stack = []; //stack to hold expression symbols

    /* evaluate the postfix expression array and return the result*/
    for(let i=0; i < postfix.length; i++){
        if(typeof(postfix[i]) === "number")
            stack.push(postfix[i])
        else{
            var v2= stack.pop();
            var v1= stack.pop();
            stack.push(result(v1,v2,postfix[i]));
        }
    }
    let answer = Math.round(stack.pop()*10000000000)/10000000000;//answer is the last value in the stack after expression has been evaluated, 
    /*rounded to at most the 10th decimal place to deal with decimals that aren't represented exactly in a finite amount of bits (any digits past the tenth decimal place are rounded away so 12.00000000001 will equal 12, those are the limits of this calculator)*/
    return answer;
}

//takes infix expression string operationString and returns a postfix expression array  which is an array of numbers (representing operands)
//and characters (representing operators)
function infixToPostfix(operationString){
    var stack=[];//stack for operators
    var postfix=[];//array for postfix expression
    
    for(let i=0; i < operationString.length; i++){
        if(isDigit(operationString[i])){
            //if we encounter part of a number, push the entire number onto the postfix array
            let endNumber = pushNumber(operationString,i,postfix);
            i= endNumber;//skip to the last digit of this number
        }else if(unaryMinus(operationString,i)){
            //if we encounter a unary minus, replace it in the infix expression with n* where n represents -1 and * is a multiply operator with higher precedence than ×
            //then repeat this iteration of the loop at the newly placed "n"
            operationString = operationString.substr(0,i)+"n*"+operationString.substr(i+1,operationString.length);
            i--;//repeat
        }else if(operationString[i]==="n"){//n represents -1, push -1 onto the stack
            postfix.push(-1);
        }else if(operationString[i]==="("){
            //if we encounter an open parenthesis, push it onto the stack
            stack.push(operationString[i]);
        }else if(operationString[i]===")"){
            //if we encounter a close parenthesis, pop operators from the stack and push them onto prefix until we reach the most recently pushed open parenthesis
            while(stack.length>0 && stack[stack.length-1]!=="(")
                postfix.push(stack.pop());
            stack.pop();//also pop out the matching open parenthesis
        }else if(stack.length===0){
            //if we encounter any operator (not a digit or unary minus or parentheses) and stack is empty, push operator on stack
            stack.push(operationString[i]);
        }else{
            //if we an encounter an operator, stack is not empty, pop higher/equal precedence operators off stack and append to postfix until we reach lower precedence operator or an open parenthesis
            while(stack.length > 0 && greaterOrEqualPrecedence(stack[stack.length-1],operationString[i]) && stack[stack.length-1]!=="("){
                postfix.push(stack.pop());
            }
            //then, push operator on stack
            stack.push(operationString[i]);
        }
        
    }
    while(stack.length>0){
        postfix.push(stack.pop());
    }
    return postfix;
}

//pushes the number starting at index i of operationString onto the passed postfix array, so operationString must have a digit at i
//returns the index of the last digit of the number
function pushNumber(operationString,i,postfix){
    let number =0; let k = 0;//number holds the number to push, k is a counter for digits
    let digitStack=[];//stack for digits
    let afterDecimal=false;//indicates when the digits are before/after a potential decimal point
    
    //starting with the first digit, push each digit onto the digit stack
            
    for(var j=i; isDigit(operationString[j]); j++){
        if(operationString[j]===".")//if the digit is a decimal point, don't push it on the digit stack but indicate that future digits are after the decimal
            afterDecimal=true;
        else{//otherwise push digit onto stack
            digitStack.push(parseInt(operationString[j],10));
            //for each digit after the decimal, decrement k
            if(afterDecimal) k--;
        } 
    }
            
    //starting from the top of the stack, add the digits together to get the number
    while(digitStack.length>0){
        number += digitStack.pop()*Math.pow(10,k);
        k++;
    }
    
    //deal with exponents from javascript results
    if(operationString[j]==="e"){
        let expDigitStack=[];  let exponent=0; let l=0; let expSign = operationString[j+1];
        for(j=j+2; isDigit(operationString[j]); j++){
            expDigitStack.push(parseInt(operationString[j],10));
        }
        while(expDigitStack.length>0){
            exponent+= expDigitStack.pop()*Math.pow(10,l);
            l++;
        }
        if(expSign==="+")
            number = number*Math.pow(10,exponent);
        else if(expSign==="-")
            number = number*Math.pow(10,-1*exponent);
        
    }
    
    postfix.push(number);//append the number to the postfix array
            
    return j-1;//return index of last digit of pushed number
    
}


//returns true if the character at mIndex is representing a unary minus symbol in the expression, false otherwise
function unaryMinus(operationString,mIndex){
    if(operationString[mIndex]!=="-")
        return false;
    let prevChar = operationString.length > mIndex ? operationString[mIndex-1] : null;
    return !isValidExpression(prevChar);//if previous character is the end of a valid expression, then this must be a binary operator, otherwise the previous character is an operator like and this minus is a unary operator
}

//returns true if a >= b in precedence, false otherwise
function greaterOrEqualPrecedence(a,b){
    var highestPrecedence=["*"];
    var middlePrecedence= ["×","÷"];
    var lowerPrecedence= ["+","-"];
    //only false if a is in lowerPrecedence and b is not in lowerPrecedence
    //or false if a is in middlePrecedence and b is in highestPrecedence
    if(middlePrecedence.includes(a))
        return !highestPrecedence.includes(b);
    if(lowerPrecedence.includes(a)){
        return lowerPrecedence.includes(b);
    }else
        return true;
}

//returns the result of a operator b
function result(a,b,operator){
    switch(operator){
        case "+":
            return a+b;
        case "-":
            return a-b;
        case "×":
        case "*":
            return a*b;
        case "÷":
            return a/b;
        default:
            console.log("someting went wrong, following binary operator invalid: " + operator);
            return 0;
    }
}

/*since javascript returns scientific notation form for strings of large numbers, I programmed the calculator to 
handle these exponents, but for the sake of time and simplicity I won't allow users to meddle with backspacing critical portions of scientific notation forms, this function will check if the end of the string is a number
in scientific notation
*/
function endsWithScientificNotation(operationString){
    let stringLen = operationString.length;
    let criticalPortion= operationString.substr(stringLen-3,2);
    return criticalPortion==="e+" || criticalPortion==="e-";
}



ReactDOM.render(
  <Calculator />,
  document.getElementById('root')
);
